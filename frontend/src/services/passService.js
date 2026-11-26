import apiClient from './apiClient';

/**
 * Student: Fetch all registered passes grouped into upcoming & past events.
 */
export async function fetchMyPasses() {
  const response = await apiClient.get('/student/passes');
  return response.data.data;
}

/**
 * Student: Download digital QR pass PDF for a confirmed registration.
 */
export async function triggerPassDownload(registrationId, registrationCode = '') {
  const response = await apiClient.get(
    `/student/passes/${encodeURIComponent(registrationId)}/download`,
    {
      responseType: 'blob',
    }
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `EventHub_Pass_${registrationCode || registrationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Admin: Fetch events and attendance/check-in overview logs.
 */
export async function fetchAdminAttendanceOverview(eventId = '') {
  const params = eventId && eventId !== 'all' ? { eventId } : {};
  const response = await apiClient.get('/admin/attendance', { params });
  return response.data.data;
}

/**
 * Admin: Verify a student's event pass QR token or pass code (without checking in).
 */
export async function verifyAdminPass({ token, eventId }) {
  const response = await apiClient.post('/admin/passes/verify', {
    token,
    eventId: eventId && eventId !== 'all' ? eventId : undefined,
  });
  return response.data.data;
}

/**
 * Admin: Atomically verify pass and mark student attendance.
 */
export async function checkInAdminPass({ token, eventId }) {
  const response = await apiClient.post('/admin/passes/check-in', {
    token,
    eventId: eventId && eventId !== 'all' ? eventId : undefined,
  });
  return response.data.data;
}
