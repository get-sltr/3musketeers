export const DEFAULT_PROFILE_IMAGE = '/black-white-silhouette-man-600nw-1677576007.webp'

export function resolveProfilePhoto(
  photoUrl?: string | null,
  photos?: (string | null)[] | null
): string {
  if (photoUrl && photoUrl.trim().length > 0) {
    return photoUrl
  }

  if (Array.isArray(photos)) {
    for (const candidate of photos) {
      if (candidate && candidate.trim().length > 0) {
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

