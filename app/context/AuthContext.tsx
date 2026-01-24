'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

  const isAuthenticated = !!user;

  // Восстановление пользователя из localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  // Защита маршрутов
  useEffect(() => {
    if (isCheckingAuth) return;

    const publicRoutes = ['/auth/signin', '/auth/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      const timer = setTimeout(() => {
        router.push('/auth/signin');
      }, 0);
      return () => clearTimeout(timer);
    }

    if (isAuthenticated && isPublicRoute) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, isAuthenticated, isCheckingAuth, router]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Формат данных для входа
      const loginData = {
        email: email.trim(),
        password: password.trim(),
      };

      // 1. Логиним пользователя
      const loginResponse = await fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/user/login/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(loginData),
        },
      );

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error('Login error response:', errorText);

        if (loginResponse.status === 400 || loginResponse.status === 412) {
          throw new Error('Некорректный формат данных');
        } else if (loginResponse.status === 401) {
          throw new Error('Неверный email или пароль');
        } else {
          throw new Error(`Ошибка сервера: ${loginResponse.status}`);
        }
      }

      const userData = await loginResponse.json();
      console.log('Login success:', userData);

      // 2. Получаем токены
      const tokenResponse = await fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/user/token/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(loginData),
        },
      );

      if (!tokenResponse.ok) {
        throw new Error('Ошибка при получении токена');
      }

      const tokens = await tokenResponse.json();

      // 3. Сохраняем данные
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);

      // 4. Редирект на главную
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Ошибка авторизации:', error);
      throw new Error(error.message || 'Произошла ошибка при авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);

      // Формат данных для регистрации согласно API
      const signupData = {
        email: email.trim(),
        password: password.trim(),
        username: username.trim(),
      };

      console.log('Sending signup data:', signupData);

      const response = await fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/user/signup/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(signupData),
        },
      );

      const responseText = await response.text();
      console.log('Signup response:', response.status, responseText);

      if (!response.ok) {
        let errorMessage = 'Ошибка при регистрации';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Парсим успешный ответ
      const data = JSON.parse(responseText);
      console.log('Registration successful:', data);

      // После успешной регистрации редирект на страницу входа
      router.push('/auth/signin');
      router.refresh();
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      throw new Error(error.message || 'Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);

    router.push('/auth/signin');
    router.refresh();
  };

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
