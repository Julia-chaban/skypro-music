// app/context/AuthContext.tsx
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  const isAuthenticated = !!user;

  // Функция для сохранения данных в localStorage
  const saveAuthData = useCallback(
    (userData: User, accessToken: string, refreshToken: string) => {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    [],
  );

  // Функция для очистки данных из localStorage
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      console.log('Checking auth:', { storedUser, accessToken });

      if (storedUser && accessToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('User restored from localStorage:', parsedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          clearAuthData();
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [clearAuthData]);

  // Редирект в зависимости от авторизации
  useEffect(() => {
    if (isCheckingAuth) return;

    console.log('Auth check:', {
      pathname,
      isAuthenticated,
      isCheckingAuth,
    });

    const publicRoutes = ['/auth/signin', '/auth/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (isCheckingAuth) return;

    if (!isAuthenticated && !isPublicRoute) {
      console.log('Redirecting to signin - not authenticated');
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      console.log('Redirecting to home - already authenticated');
      router.push('/');
      return;
    }
  }, [pathname, isAuthenticated, isCheckingAuth, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        console.log('Login attempt:', { email });

        const loginData = {
          email: email.trim(),
          password: password.trim(),
        };

        // Получаем токены
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

        console.log('Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
          let errorMessage = 'Неверный email или пароль';
          try {
            const errorData = await tokenResponse.json();
            errorMessage = errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        const tokens = await tokenResponse.json();
        console.log('Tokens received:', tokens);

        if (!tokens.access || !tokens.refresh) {
          throw new Error('Неверный формат ответа от сервера');
        }

        // Получаем данные пользователя
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

        let userData;
        if (userResponse.ok) {
          userData = await userResponse.json();
        } else {
          userData = {
            email: email,
            username: email.split('@')[0],
            _id: Date.now(),
          };
        }

        console.log('User data:', userData);

        // Сохраняем данные
        saveAuthData(userData, tokens.access, tokens.refresh);
        setUser(userData);

        console.log('Login successful, redirecting to /');
        router.push('/');
        router.refresh();
      } catch (error: any) {
        console.error('Login error:', error);
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
        console.log('Signup attempt:', { email, username });

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

        console.log('Signup response status:', response.status);

        if (!response.ok) {
          let errorMessage = 'Ошибка при регистрации';
          try {
            const errorData = await response.json();
            errorMessage =
              errorData.message || errorData.detail || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }

        await login(email, password);
      } catch (error: any) {
        console.error('Signup error:', error);
        throw new Error(error.message || 'Произошла ошибка при регистрации');
      } finally {
        setIsLoading(false);
      }
    },
    [login],
  );

  const logout = useCallback(() => {
    console.log('Logging out');

    // Очищаем состояние
    clearAuthData();
    setUser(null);

    // Очищаем избранное в Redux
    dispatch(clearFavorites());

    // Если находимся на странице избранного, редирект на главную
    if (pathname === '/favorites') {
      router.push('/');
    } else {
      router.push('/auth/signin');
    }

    router.refresh();
  }, [clearAuthData, dispatch, pathname, router]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
