import type { NextApiRequest, NextApiResponse } from 'next'

// --- Types ---
// These types define the contract for your API
interface EtaApiRequest extends NextApiRequest {
  query: {
    fromLon: string
    fromLat: string
    toLon: string
    toLat: string
  }
}

// This is the shape of the data we will send back to the client
export interface ETAResult {
  distance: number // in miles
  duration: number // in minutes
}

// A minimal type for the Mapbox API response
interface MapboxRoute {
  distance: number // in meters
  duration: number // in seconds
}

interface MapboxResponse {
  routes: MapboxRoute[]
  code: string
  message?: string
}

// --- Constants ---
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN // Uses the SECURE token
const METERS_TO_MILES = 0.000621371
const SECONDS_TO_MINUTES = 1 / 60

// --- API Handler ---
export default async function handler(
  req: EtaApiRequest,
  res: NextApiResponse<ETAResult | { error: string }> // Responds with data or an error
) {
  // 1. Enforce GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 2. Check for server-side token
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured on server.')
    return res.status(500).json({ error: 'Internal server configuration error.' })
  }

  try {
    const { fromLon, fromLat, toLon, toLat } = req.query

    // 3. Validate input parameters
    if (!fromLon || !fromLat || !toLon || !toLat) {
      return res.status(400).json({ error: 'Missing required location parameters.' })
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLon},${fromLat};${toLon},${toLat}?access_token=${MAPBOX_TOKEN}`

    // 4. Call Mapbox API
    const response = await fetch(url)

    // 5. Robust error handling (fetches don't throw for 4xx/5xx)
    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Mapbox API Error:', errorBody)
      return res.status(response.status).json({ error: errorBody.message || 'Mapbox API error' })
    }

    const data: MapboxResponse = await response.json()

    // 6. Check for valid route
    if (data.routes && data.routes[0]) {
      const route = data.routes[0]
      
      // 7. Send successful response
      return res.status(200).json({
        distance: parseFloat((route.distance * METERS_TO_MILES).toFixed(1)),
        duration: Math.round(route.duration * SECONDS_TO_MINUTES),
      })
    } else {
      // Handle "NoRoute" or other valid-but-empty responses
      return res.status(404).json({ error: data.message || 'No route found.' })
    }
  } catch (error) {
    console.error('Internal API error:', error)
    return res.status(500).json({ error: 'Internal server error.' })
  }
}