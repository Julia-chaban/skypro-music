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

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
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
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    throw new ApiError('Требуется авторизация', 401);
  }

  return fetchApi<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

export const refreshToken = async (): Promise<TokenResponse> => {
  const refreshTokenValue = localStorage.getItem('refreshToken');

  if (!refreshTokenValue) {
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    throw error;
  }
};

export const fetchWithAuthRetry = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    return await fetchWithAuth<T>(endpoint, options);
  } catch (error: any) {
    if (error.status === 401 && error.message.includes('Токен')) {
      await refreshToken();
      return await fetchWithAuth<T>(endpoint, options);
    }
    throw error;
  }
};

// Примечание: функция formatDuration теперь в отдельном файле utils/formatDuration.ts
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
