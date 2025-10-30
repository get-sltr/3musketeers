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


