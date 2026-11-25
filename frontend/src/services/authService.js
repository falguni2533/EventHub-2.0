import apiClient from './apiClient';

export const registerUser = async (payload) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data.data;
};

export const fetchCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data.data.user;
};

export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const fetchStudentDashboard = async () => {
  const response = await apiClient.get('/student/dashboard');
  return response.data.data;
};

export const fetchAdminDashboard = async () => {
  const response = await apiClient.get('/admin/dashboard');
  return response.data.data;
};
