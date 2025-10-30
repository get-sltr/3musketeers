export interface SubmitReportInput {
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details?: string;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-fA-F-]{8,}$/.test(value);
}

export async function submitReport(input: SubmitReportInput): Promise<{ success: true }>{
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid report payload');
  }

  const { reporterId, reportedUserId, reason, details } = input;

  if (!reporterId || !isUuidLike(reporterId)) {
    throw new Error('Invalid reporterId');
  }
  if (!reportedUserId || !isUuidLike(reportedUserId)) {
    throw new Error('Invalid reportedUserId');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    throw new Error('Reason must be at least 3 characters');
  }
  if (details && details.length > 5000) {
    throw new Error('Details too long');
  }

  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reporterId, reportedUserId, reason: reason.trim(), details }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Report submission failed: ${errorText}`);
  }

  return { success: true };
}

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
