import { getMapboxToken } from '@/lib/maps/getMapboxToken'

interface ETAResult {
  distance: number  // in miles
  duration: number  // in minutes
}

export async function calculateETA(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<ETAResult> {
  let token: string | null = null
  try {
    token = await getMapboxToken()
  } catch (error) {
    console.warn('Mapbox token not found, using fallback calculation')
    const distance = calculateDistance(fromLat, fromLon, toLat, toLon)
    return {
      distance: parseFloat(distance.toFixed(1)),
      duration: Math.round(distance * 2)
    }
  }

  if (!token) {
    console.warn('Mapbox token not found, using fallback calculation')
    const distance = calculateDistance(fromLat, fromLon, toLat, toLon)
    return {
      distance: parseFloat(distance.toFixed(1)),
      duration: Math.round(distance * 2)
    }
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLon},${fromLat};${toLon},${toLat}?access_token=${token}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.routes && data.routes[0]) {
      const route = data.routes[0]
      return {
        distance: parseFloat((route.distance * 0.000621371).toFixed(1)),
        duration: Math.round(route.duration / 60)
      }
    }
  } catch (error) {
    console.error('Mapbox API error:', error)
  }
  const distance = calculateDistance(fromLat, fromLon, toLat, toLon)
  return {
    distance: parseFloat(distance.toFixed(1)),
    duration: Math.round(distance * 2)
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function getCurrentUserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        () => {
          resolve({ latitude: 34.0522, longitude: -118.2437 })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      resolve({ latitude: 34.0522, longitude: -118.2437 })
    }
  })
}


