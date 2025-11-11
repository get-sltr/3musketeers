import { NextRequest, NextResponse } from 'next/server'

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '5000' // meters

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  if (!FOURSQUARE_API_KEY) {
    console.error('FOURSQUARE_API_KEY not set')
    return NextResponse.json({ venues: [] })
  }

  try {
    // Foursquare Places API v3
    const categories = [
      '4bf58dd8d48988d1d8941735', // Gay Bar
      '4bf58dd8d48988d181941735', // Nightclub (we'll filter for LGBTQ)
      '4bf58dd8d48988d1ed931735', // Spa/Bathhouse
    ]

    const categoryQuery = categories.join(',')

    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=${radius}&categories=${categoryQuery}&limit=50`,
      {
        headers: {
          'Authorization': FOURSQUARE_API_KEY,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Foursquare API error:', response.status)
      return NextResponse.json({ venues: [] })
    }

    const data = await response.json()

    const venues = (data.results || []).map((place: any) => ({
      id: place.fsq_id,
      name: place.name,
      latitude: place.geocodes.main.latitude,
      longitude: place.geocodes.main.longitude,
      category: place.categories?.[0]?.name || 'LGBTQ Venue',
      address: place.location?.formatted_address || '',
      type: getVenueType(place.categories?.[0]?.name || '')
    }))

    return NextResponse.json({ venues })
  } catch (error) {
    console.error('Error fetching LGBTQ venues:', error)
    return NextResponse.json({ venues: [] })
  }
}

function getVenueType(categoryName: string): 'bar' | 'club' | 'sauna' | 'restaurant' {
  const lower = categoryName.toLowerCase()
  if (lower.includes('bar')) return 'bar'
  if (lower.includes('club') || lower.includes('nightclub')) return 'club'
  if (lower.includes('spa') || lower.includes('bath') || lower.includes('sauna')) return 'sauna'
  return 'restaurant'
}
