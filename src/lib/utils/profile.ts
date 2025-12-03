export const DEFAULT_PROFILE_IMAGE = '/black-white-silhouette-man-600nw-1677576007.webp'

/**
 * Validate if a URL is a valid photo URL
 * Filters out malformed URLs and non-image URLs
 */
function isValidPhotoUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return false
  // Reject URLs that look malformed (common error patterns)
  if (url.includes('undefined') || url.includes('null')) return false

  // Must be a valid URL format
  try {
    // Allow relative URLs starting with /
    if (url.startsWith('/')) {
      return true
    }
    const parsed = new URL(url)
    // Must be http or https
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function resolveProfilePhoto(
  photoUrl?: string | null,
  photos?: (string | null)[] | null
): string {
  // Check primary photo_url
  if (photoUrl && isValidPhotoUrl(photoUrl)) {
    return photoUrl
  }

  // Check photos array
  if (Array.isArray(photos)) {
    for (const candidate of photos) {
      if (candidate && isValidPhotoUrl(candidate)) {
        return candidate
      }
    }
  }

  return DEFAULT_PROFILE_IMAGE
}

export function formatDistance(miles?: number | null): string | undefined {
  if (miles == null) return undefined
  if (miles < 0.1) return '<0.1 mi'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}

export function calculateETA(miles?: number | null): string | undefined {
  if (miles == null) return undefined
  // Rough estimate: 30 mph average speed
  const hours = miles / 30
  if (hours < 0.1) return '<1 min'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${hours.toFixed(1)} hrs`
}

