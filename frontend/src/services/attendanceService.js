import apiClient from './apiClient';

const buildFilterParams = ({ eventId, date, status, search } = {}) => {
  const params = {};
  if (eventId && eventId !== 'all') params.eventId = eventId;
  if (date) params.date = date;
  if (status && status !== 'all') params.status = status;
  if (search && search.trim()) params.search = search.trim();
  return params;
};

/**
 * Admin: Fetch full attendance metrics, charts, and searchable student records.
 */
export async function fetchAdminAttendanceAnalytics(filters = {}) {
  const response = await apiClient.get('/admin/attendance/analytics', {
    params: buildFilterParams(filters),
  });
  return response.data.data;
}

/**
 * Student: Fetch personal attendance metrics, charts, and event attendance history.
 */
export async function fetchStudentAttendanceAnalytics(filters = {}) {
  const response = await apiClient.get('/student/attendance', {
    params: buildFilterParams(filters),
  });
  return response.data.data;
}
