import apiClient from './apiClient';

/**
 * Student: Fetch certificates for the currently authenticated student.
 */
export async function getMyCertificates() {
  const response = await apiClient.get('/student/certificates');
  return response.data;
}

/**
 * Admin: Fetch all certificates with optional status, eventId, and search query.
 */
export async function getAllCertificates(params = {}) {
  const response = await apiClient.get('/admin/certificates', { params });
  return response.data;
}

/**
 * Admin: Fetch events and their registered participants with attendance & certificate status.
 */
export async function getEventsWithParticipants() {
  const response = await apiClient.get('/admin/certificates/events');
  return response.data;
}

/**
 * Admin: Bulk generate certificates for all eligible ('present') participants of an event.
 */
export async function generateEventCertificates(eventId) {
  const response = await apiClient.post(`/admin/certificates/generate/${eventId}`);
  return response.data;
}

/**
 * Admin: Generate a single certificate for an eligible participant.
 */
export async function generateSingleCertificate(eventId, participantId) {
  const response = await apiClient.post('/admin/certificates/generate-single', {
    eventId,
    participantId,
  });
  return response.data;
}

/**
 * Admin: Revoke an issued certificate with an audit reason.
 */
export async function revokeCertificate(certificateId, reason = '') {
  const response = await apiClient.patch(`/admin/certificates/revoke/${certificateId}`, {
    reason,
  });
  return response.data;
}

/**
 * Public: Verify certificate authenticity by ID.
 */
export async function verifyCertificate(certificateId) {
  const response = await apiClient.get(
    `/certificates/verify/${encodeURIComponent(certificateId)}`
  );
  return response.data;
}

/**
 * Download certificate PDF blob via apiClient and trigger browser file save.
 */
export async function triggerCertificateDownload(certificateId, filename = null) {
  const response = await apiClient.get(
    `/certificates/download/${encodeURIComponent(certificateId)}`,
    {
      responseType: 'blob',
    }
  );

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || `EventHub_Certificate_${certificateId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
