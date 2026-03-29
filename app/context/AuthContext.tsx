'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch } from '@/store/features/store';
import { clearFavorites } from '@/store/features/trackSlice';

interface User {
  email: string;
  username: string;
  _id: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const isAuthenticated = !!user;

  const saveAuthData = useCallback(
    (userData: User, accessToken: string, refreshToken: string) => {
      try {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
      } catch (error) {
        console.error('Ошибка сохранения данных', error);
      }
    },
    [],
  );

  const clearAuthData = useCallback(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } catch (error) {
      console.error('Ошибка очистки данных', error);
    }
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');

        if (storedUser && accessToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.email && parsedUser._id) {
              setUser(parsedUser);
            } else {
              clearAuthData();
            }
          } catch (error) {
            clearAuthData();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();

    const intervalId = setInterval(() => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (!storedUser || !accessToken) {
        setUser(null);
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [clearAuthData]);

  useEffect(() => {
    if (!isInitialized) return;

    const protectedRoutes = ['/favorites'];
    const isProtectedRoute = protectedRoutes.includes(pathname);

    if (!isAuthenticated && isProtectedRoute) {
      router.push('/auth/signin');
    }
  }, [pathname, isAuthenticated, isInitialized, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);

        const loginData = {
          email: email.trim(),
          password: password.trim(),
        };

        const tokenResponse = await fetch(
          'https://webdev-music-003b5b991590.herokuapp.com/user/token/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
          },
        );

        if (!tokenResponse.ok) {
          let errorMessage = 'Неверный email или пароль';
          try {
            const errorData = await tokenResponse.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        const tokens = await tokenResponse.json();

        if (!tokens.access || !tokens.refresh) {
          throw new Error('Неверный формат ответа от сервера');
        }

        const userResponse = await fetch(
          'https://webdev-music-003b5b991590.herokuapp.com/user/login/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
          },
        );

        let userData: User;

        if (userResponse.ok) {
          userData = await userResponse.json();
        } else {
          userData = {
            email: email,
            username: email.split('@')[0],
            _id: Date.now(),
          };
        }

        saveAuthData(userData, tokens.access, tokens.refresh);

        router.push('/');
      } catch (error: any) {
        throw new Error(error.message || 'Произошла ошибка при авторизации');
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuthData, router],
  );

  const signup = useCallback(
    async (email: string, password: string, username: string) => {
      try {
        setIsLoading(true);

        const signupData = {
          email: email.trim(),
          password: password.trim(),
          username: username.trim(),
        };

        const response = await fetch(
          'https://webdev-music-003b5b991590.herokuapp.com/user/signup/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData),
          },
        );

        if (!response.ok) {
          let errorMessage = 'Ошибка при регистрации';
          try {
            const errorData = await response.json();
            errorMessage =
              errorData.message || errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        const loginData = {
          email: email.trim(),
          password: password.trim(),
        };

        const tokenResponse = await fetch(
          'https://webdev-music-003b5b991590.herokuapp.com/user/token/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
          },
        );

        if (!tokenResponse.ok) {
          throw new Error('Не удалось получить токены после регистрации');
        }

        const tokens = await tokenResponse.json();

        if (!tokens.access || !tokens.refresh) {
          throw new Error('Неверный формат токенов');
        }

        const userData: User = {
          email: email,
          username: username,
          _id: Date.now(),
        };

        saveAuthData(userData, tokens.access, tokens.refresh);

        router.push('/');
      } catch (error: any) {
        throw new Error(error.message || 'Произошла ошибка при регистрации');
      } finally {
        setIsLoading(false);
      }
    },
    [saveAuthData, router],
  );

  const logout = useCallback(() => {
    clearAuthData();
    dispatch(clearFavorites());

    if (pathname === '/favorites') {
      router.push('/');
    } else {
      router.push('/auth/signin');
    }
  }, [clearAuthData, dispatch, pathname, router]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
  };

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div>Загрузка...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
