export interface BlockedUser {
  userId: string
  blockedAt: Date
  reason?: string
}

export interface Report {
  reportedUserId: string
  reporterUserId: string
  reason: string
  category: 'harassment' | 'fake' | 'inappropriate' | 'spam' | 'other'
  timestamp: Date
  status: 'pending' | 'reviewed'
}

// Store blocked users in localStorage for now (move to Supabase later)
export const blockUser = (userId: string, reason?: string) => {
  const blocked = getBlockedUsers()
  blocked.push({
    userId,
    blockedAt: new Date(),
    reason
  })
  localStorage.setItem('sltr_blocked_users', JSON.stringify(blocked))
}

export const getBlockedUsers = (): BlockedUser[] => {
  const stored = localStorage.getItem('sltr_blocked_users')
  return stored ? JSON.parse(stored) : []
}

export const isUserBlocked = (userId: string): boolean => {
  const blocked = getBlockedUsers()
  return blocked.some(b => b.userId === userId)
}

export const submitReport = async (report: Omit<Report, 'timestamp' | 'status'>) => {
  // For now, store locally (move to Supabase later)
  const reports = getReports()
  reports.push({
    ...report,
    timestamp: new Date(),
    status: 'pending'
  })
  localStorage.setItem('sltr_reports', JSON.stringify(reports))
}

export const getReports = (): Report[] => {
  const stored = localStorage.getItem('sltr_reports')
  return stored ? JSON.parse(stored) : []
}
