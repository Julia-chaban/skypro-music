import { TokenResponse } from '@/types/auth';

const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}


interface ErrorResponse {
  message?: string;
  detail?: string;
}

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

const redirectToLogin = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/signin';
  }
};

export const refreshToken = async (): Promise<TokenResponse> => {
  const refreshTokenValue = localStorage.getItem('refreshToken');

  if (!refreshTokenValue) {
    redirectToLogin();
    throw new ApiError('Refresh токен не найден', 401);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new ApiError(`Ошибка обновления: ${response.status}`, response.status);
    }

    const data = (await response.json()) as RefreshTokenResponse;

    if (!data.access) {
      throw new ApiError('Access токен не получен');
    }

    localStorage.setItem('accessToken', data.access);

    return data as TokenResponse;
  } catch (error) {
    redirectToLogin();
    throw error;
  }
};

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit',
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      let errorMessage = `HTTP ошибка! статус: ${response.status}`;
      try {
        const errorData = (await response.json()) as ErrorResponse;
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        
      }
      throw new ApiError(errorMessage, response.status);
    }

    if (response.status === 204 || options.method === 'DELETE') {
      return {} as T;
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Таймаут запроса (15 секунд)', 408);
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new ApiError('Не удалось подключиться к серверу. Проверьте интернет соединение.', 0);
      }
    }
    
    throw new ApiError('Неизвестная ошибка при выполнении запроса');
  }
};

export const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  let accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    redirectToLogin();
    throw new ApiError('Требуется авторизация', 401);
  }

  const makeRequest = async (token: string): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      mode: 'cors',
    }).finally(() => clearTimeout(timeoutId));

    if (response.status === 401) {
      throw new ApiError('Токен истек', 401);
    }

    if (!response.ok) {
      let errorMessage = `HTTP ошибка! статус: ${response.status}`;
      try {
        const errorData = (await response.json()) as ErrorResponse;
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        
      }
      throw new ApiError(errorMessage, response.status);
    }

    if (response.status === 204 || options.method === 'DELETE') {
      return {} as T;
    }

    return await response.json() as T;
  };

  try {
    return await makeRequest(accessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      try {
        const newTokens = await refreshToken();
        return await makeRequest(newTokens.access);
      } catch {
        redirectToLogin();
        throw new ApiError('Сессия истекла', 401);
      }
    }
    throw error;
  }
};

export default {
  fetchApi,
  fetchWithAuth,
  refreshToken,
  ApiError,
};