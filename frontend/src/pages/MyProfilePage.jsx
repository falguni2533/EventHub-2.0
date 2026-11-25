import { useEffect } from 'react';
import AdminProfileView from '../components/profile/AdminProfileView';
import StudentProfileView from '../components/profile/StudentProfileView';
import { useAuth } from '../context/AuthContext';

export default function MyProfilePage() {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    refreshUser().catch(() => {
      // Keep cached authenticated user if background sync fails transiently
    });
  }, [refreshUser]);

  if (user?.role === 'admin') {
    return <AdminProfileView />;
  }

  return <StudentProfileView />;
}
