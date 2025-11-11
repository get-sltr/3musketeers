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

