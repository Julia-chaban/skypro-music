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
    console.log('[API] Редирект на вход');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/signin';
  }
};

// Функция для обновления токена
export const refreshToken = async (): Promise<TokenResponse> => {
  const refreshTokenValue = localStorage.getItem('refreshToken');

  if (!refreshTokenValue) {
    console.error('[API] Refresh токен не найден');
    redirectToLogin();
    throw new ApiError('Refresh токен не найден', 401);
  }

  console.log('[API] Обновление токена...');

  try {
    const response = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка обновления: ${response.status}`);
    }

    const data = await response.json();

    if (!data.access) {
      throw new Error('Access токен не получен');
    }

    localStorage.setItem('accessToken', data.access);
    console.log('[API] Токен обновлен');

    return data;
  } catch (error) {
    console.error('[API] Ошибка обновления токена:', error);
    redirectToLogin();
    throw error;
  }
};

// БАЗОВАЯ ФУНКЦИЯ ДЛЯ ЗАПРОСОВ БЕЗ АВТОРИЗАЦИИ
export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`📡 [fetchApi] Запрос: ${url}`, options.method || 'GET');

    // Добавляем таймаут для запроса
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      mode: 'cors', // Явно указываем CORS режим
      credentials: 'omit', // Не отправляем куки
    }).finally(() => clearTimeout(timeoutId));

    console.log(`📡 [fetchApi] Ответ: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorMessage = `HTTP ошибка! статус: ${response.status}`;
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

    const data = await response.json();
    console.log(`📡 [fetchApi] Успешно: ${endpoint}, получено:`, 
      Array.isArray(data) ? `${data.length} элементов` : 'объект'
    );
    return data;
  } catch (error: any) {
    console.error(`❌ [fetchApi] Ошибка (${endpoint}):`, error);

    // Обработка разных типов ошибок
    if (error.name === 'AbortError') {
      throw new ApiError('Таймаут запроса (15 секунд)', 408);
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      // Проверяем доступность API
      console.error('🌐 Возможные проблемы:');
      console.error('1. API сервер недоступен');
      console.error('2. Проблема с CORS (нужны заголовки на сервере)');
      console.error('3. Блокировка AdBlock или антивируса');
      
      // Тестируем доступность API
      try {
        const testResponse = await fetch(API_BASE_URL, { method: 'HEAD' });
        console.log(`🌐 Проверка API: ${testResponse.status} ${testResponse.statusText}`);
      } catch (testError) {
        console.error('🌐 API полностью недоступен');
      }
      
      throw new ApiError('Не удалось подключиться к серверу. Проверьте интернет соединение.', 0);
    }
    
    throw error;
  }
};

// ФУНКЦИЯ ДЛЯ ЗАПРОСОВ С АВТОРИЗАЦИЕЙ
export const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  let accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    console.error('[fetchWithAuth] Access токен не найден');
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

    console.log(`🔐 [fetchWithAuth] Запрос: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      mode: 'cors',
    }).finally(() => clearTimeout(timeoutId));

    console.log(
      `🔐 [fetchWithAuth] Ответ: ${response.status} ${response.statusText}`,
    );

    // Если токен истек, пробуем обновить
    if (response.status === 401) {
      console.log('[fetchWithAuth] Токен истек, пытаемся обновить...');
      throw new ApiError('Токен истек', 401);
    }

    if (!response.ok) {
      let errorMessage = `HTTP ошибка! статус: ${response.status}`;
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

  try {
    return await makeRequest(accessToken);
  } catch (error: any) {
    // Если ошибка 401, пробуем обновить токен и повторить
    if (error.status === 401) {
      try {
        console.log('[fetchWithAuth] Обновляем токен...');
        const newTokens = await refreshToken();
        console.log('[fetchWithAuth] Новый токен получен, повторяем запрос');
        return await makeRequest(newTokens.access);
      } catch (refreshError) {
        console.error(
          '[fetchWithAuth] Не удалось обновить токен:',
          refreshError,
        );
        redirectToLogin();
        throw new ApiError('Сессия истекла', 401);
      }
    }
    throw error;
  }
};

// Экспортируем все функции
export default {
  fetchApi,
  fetchWithAuth,
  refreshToken,
  ApiError,
};