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
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

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

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Login attempt:', { email });

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

      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

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
  };

  const signup = async (email: string, password: string, username: string) => {
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
          errorMessage = errorData.message || errorData.detail || errorMessage;
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
  };

  const logout = () => {
    console.log('Logging out');
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
