import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authService from '../services/authService';
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from '../utils/tokenStorage';
import { getErrorMessage } from '../utils/errorMessage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const persistSession = useCallback((nextToken, nextUser) => {
    setStoredToken(nextToken);
    setStoredUser(nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        clearAuthStorage();
        setIsInitializing(false);
        return;
      }

      setToken(storedToken);
      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const response = await authService.getMe();
        const currentUser = response.data.user;
        persistSession(storedToken, currentUser);
      } catch {
        clearSession();
      } finally {
        setIsInitializing(false);
      }
    };

    restoreSession();
  }, [clearSession, persistSession]);

  const login = useCallback(
    async (credentials) => {
      try {
        const response = await authService.login(credentials);
        const nextToken = response.data.token;
        const nextUser = response.data.user;
        persistSession(nextToken, nextUser);
        return { user: nextUser, token: nextToken };
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Invalid email or password.'));
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      try {
        const response = await authService.register(payload);
        const nextToken = response.data.token;
        const nextUser = response.data.user;
        persistSession(nextToken, nextUser);
        return { user: nextUser, token: nextToken };
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Registration failed.'));
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isInitializing,
      login,
      register,
      logout,
    }),
    [user, token, isInitializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
