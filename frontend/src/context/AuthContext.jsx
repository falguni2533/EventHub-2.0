import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AUTH_TOKEN_KEY } from '../services/apiClient';
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [initializing, setInitializing] = useState(() =>
    Boolean(localStorage.getItem(AUTH_TOKEN_KEY))
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Rehydrate authenticated session on initial load / page refresh
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        if (active) setInitializing(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (active) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (_err) {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) setInitializing(false);
      }
    };

    restoreSession();

    const handleUnauthorized = () => {
      clearSession();
    };
    window.addEventListener('eventhub:unauthorized', handleUnauthorized);

    return () => {
      active = false;
      window.removeEventListener('eventhub:unauthorized', handleUnauthorized);
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token: jwtToken } = await loginUser(credentials);
    localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
    setToken(jwtToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (formData) => {
    const { user: createdUser, token: jwtToken } = await registerUser(formData);
    localStorage.setItem(AUTH_TOKEN_KEY, jwtToken);
    setToken(jwtToken);
    setUser(createdUser);
    return createdUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem(AUTH_TOKEN_KEY)) {
        await logoutUser();
      }
    } catch (_err) {
      // Clear local credentials even if server token already expired
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      isStudent: user?.role === 'student',
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, token, initializing, login, register, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
};
