// utils/api.ts
import { TokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Функция для редиректа на страницу входа
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/signin';
  }
};

// Функция для обновления токена с повторным запросом
export const withReauth = async <T>(
  requestFn: (accessToken: string) => Promise<T>,
  maxRetries = 1,
): Promise<T> => {
  let accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    redirectToLogin();
    throw new ApiError('Требуется авторизация', 401);
  }

  try {
    return await requestFn(accessToken);
  } catch (error: any) {
    if (error.status === 401 && maxRetries > 0) {
      try {
        // Пытаемся обновить токен
        const newAccessToken = await refreshToken();
        // Повторяем запрос с новым токеном
        return await requestFn(newAccessToken.access);
      } catch (refreshError) {
        redirectToLogin();
        throw new ApiError('Сессия истекла. Пожалуйста, войдите снова.', 401);
      }
    }
    throw error;
  }
};

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = false,
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.detail || errorMessage;
    } catch {
      // Не удалось распарсить JSON
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204 || options.method === 'DELETE') {
    return {} as T;
  }

  return response.json();
};

export const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const requestFn = async (accessToken: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      throw new ApiError('Требуется авторизация', 401);
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        // Не удалось распарсить JSON
      }
      throw new ApiError(errorMessage, response.status);
    }

    if (response.status === 204 || options.method === 'DELETE') {
      return {} as T;
    }

    return response.json();
  };

  return withReauth(requestFn);
};

export const refreshToken = async (): Promise<TokenResponse> => {
  const refreshTokenValue = localStorage.getItem('refreshToken');

  if (!refreshTokenValue) {
    redirectToLogin();
    throw new ApiError('Refresh token не найден', 401);
  }

  try {
    const response = await fetchApi<TokenResponse>('/user/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });

    localStorage.setItem('accessToken', response.access);
    return response;
  } catch (error) {
    redirectToLogin();
    throw error;
  }
};
