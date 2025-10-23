/**
 * GeoHashing utilities for efficient location-based searches
 * Implements privacy-preserving location hashing with jitter
 */

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface GeoHashResult {
  hash: string
  precision: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

/**
 * Add privacy jitter to coordinates (±50m)
 * Protects user identity while preserving proximity accuracy
 */
export function addPrivacyJitter(location: Location): Location {
  const jitterRange = 0.0005 // ~50m in degrees
  const randomJitter = () => (Math.random() - 0.5) * 2 * jitterRange
  
  return {
    latitude: location.latitude + randomJitter(),
    longitude: location.longitude + randomJitter(),
    accuracy: location.accuracy
  }
}

/**
 * Generate geohash for efficient nearby searches
 * Higher precision = smaller area, more accurate
 */
export function generateGeoHash(location: Location, precision: number = 7): GeoHashResult {
  const jitteredLocation = addPrivacyJitter(location)
  
  // Simple geohash implementation
  const lat = jitteredLocation.latitude
  const lon = jitteredLocation.longitude
  
  // Calculate bounds for the geohash
  const latRange = 90 / Math.pow(2, Math.floor(precision / 2))
  const lonRange = 180 / Math.pow(2, Math.ceil(precision / 2))
  
  const bounds = {
    north: Math.ceil(lat / latRange) * latRange,
    south: Math.floor(lat / latRange) * latRange,
    east: Math.ceil(lon / lonRange) * lonRange,
    west: Math.floor(lon / lonRange) * lonRange
  }
  
  // Generate hash string
  const hash = `${lat.toFixed(precision)}_${lon.toFixed(precision)}`
  
  return {
    hash,
    precision,
    bounds
  }
}

/**
 * Find nearby geohashes for efficient search
 */
export function getNearbyHashes(centerHash: string, radius: number = 1): string[] {
  const [lat, lon] = centerHash.split('_').map(Number)
  const hashes: string[] = []
  
  // Generate hashes in a grid around the center
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      const newLat = lat + (i * 0.001) // ~100m increments
      const newLon = lon + (j * 0.001)
      hashes.push(`${newLat.toFixed(7)}_${newLon.toFixed(7)}`)
    }
  }
  
  return hashes
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c * 0.621371 // Convert to miles
}

/**
 * Check if two locations are within a certain distance
 */
export function isWithinRadius(
  location1: Location, 
  location2: Location, 
  radiusMiles: number
): boolean {
  return calculateDistance(location1, location2) <= radiusMiles
}
