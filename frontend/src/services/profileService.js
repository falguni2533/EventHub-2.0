import apiClient from './apiClient';

export const fetchMyProfile = async () => {
  const response = await apiClient.get('/profile/me');
  return response.data.data.user;
};

export const submitStudentOnboarding = async (payload) => {
  const response = await apiClient.put('/student/profile/onboarding', payload);
  return response.data.data.user;
};

export const updateStudentProfile = async (payload) => {
  const response = await apiClient.patch('/student/profile', payload);
  return response.data.data.user;
};

export const updateAdminProfile = async (payload) => {
  const response = await apiClient.patch('/admin/profile', payload);
  return response.data.data.user;
};

export const updateProfilePicture = async (profilePicture) => {
  const response = await apiClient.patch('/profile/picture', { profilePicture });
  return response.data.data.user;
};

export const changePassword = async (payload) => {
  const response = await apiClient.patch('/profile/password', payload);
  return response.data;
};
