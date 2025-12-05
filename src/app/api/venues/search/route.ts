import { NextRequest, NextResponse } from 'next/server'

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY

// Foursquare category IDs
const CATEGORIES = {
  restaurant: '4bf58dd8d48988d1c4941735', // Restaurant
  bar: '4bf58dd8d48988d116941735', // Bar
  nightclub: '4bf58dd8d48988d181941735', // Nightclub
  gayBar: '4bf58dd8d48988d1d8941735', // Gay Bar
  spa: '4bf58dd8d48988d1ed931735', // Spa/Bathhouse
  cafe: '4bf58dd8d48988d16d941735', // Cafe
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '5000' // meters
  const types = searchParams.get('types') || 'restaurant,bar,lgbtq' // comma-separated: restaurant,bar,lgbtq

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  if (!FOURSQUARE_API_KEY) {
    console.error('FOURSQUARE_API_KEY not set')
    return NextResponse.json({ venues: [] })
  }

  try {
    const requestedTypes = types.split(',').map(t => t.trim())
    const categoryIds: string[] = []

    // Add categories based on requested types
    if (requestedTypes.includes('restaurant')) {
      categoryIds.push(CATEGORIES.restaurant, CATEGORIES.cafe)
    }
    if (requestedTypes.includes('bar')) {
      categoryIds.push(CATEGORIES.bar)
    }
    if (requestedTypes.includes('lgbtq')) {
      categoryIds.push(CATEGORIES.gayBar, CATEGORIES.nightclub, CATEGORIES.spa)
    }

    if (categoryIds.length === 0) {
      return NextResponse.json({ venues: [] })
    }

    const categoryQuery = categoryIds.join(',')

    const response = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=${radius}&categories=${categoryQuery}&limit=100`,
      {
        headers: {
          'Authorization': FOURSQUARE_API_KEY,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Foursquare API error:', response.status, await response.text())
      return NextResponse.json({ venues: [] })
    }

    const data = await response.json()

    const venues = (data.results || []).map((place: any) => {
      const categoryName = place.categories?.[0]?.name || ''
      const categoryId = place.categories?.[0]?.id || ''
      
      return {
        id: place.fsq_id,
        name: place.name,
        latitude: place.geocodes.main.latitude,
        longitude: place.geocodes.main.longitude,
        category: categoryName,
        address: place.location?.formatted_address || '',
        type: getVenueType(categoryName, categoryId),
        venueType: getVenueType(categoryName, categoryId), // For filtering
      }
    })

    return NextResponse.json({ venues })
  } catch (error) {
    console.error('Error fetching venues:', error)
    return NextResponse.json({ venues: [] })
  }
}

function getVenueType(categoryName: string, categoryId: string): 'restaurant' | 'bar' | 'club' | 'sauna' | 'cafe' | 'lgbtq' {
  const lower = categoryName.toLowerCase()
  
  // Check by category ID first (more reliable)
  if (categoryId === CATEGORIES.gayBar) return 'lgbtq'
  if (categoryId === CATEGORIES.spa) return 'sauna'
  if (categoryId === CATEGORIES.nightclub) return 'club'
  if (categoryId === CATEGORIES.restaurant) return 'restaurant'
  if (categoryId === CATEGORIES.bar) return 'bar'
  if (categoryId === CATEGORIES.cafe) return 'cafe'
  
  // Fallback to name matching
  if (lower.includes('gay') || lower.includes('lgbt')) return 'lgbtq'
  if (lower.includes('spa') || lower.includes('bath') || lower.includes('sauna')) return 'sauna'
  if (lower.includes('club') || lower.includes('nightclub')) return 'club'
  if (lower.includes('cafe') || lower.includes('coffee')) return 'cafe'
  if (lower.includes('bar')) return 'bar'
  if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('food')) return 'restaurant'
  
  return 'restaurant' // default
}


