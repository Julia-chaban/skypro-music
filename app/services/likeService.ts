import { Track, LikeResponse } from '@/types/track';
import { fetchWithAuth, fetchApi } from '@/utils/api';

// Основной экспорт likeService
export const likeService = {
  // Получить все избранные треки пользователя
  getFavoriteTracks: async (): Promise<Track[]> => {
    try {
      console.log('[likeService] 📡 Запрос избранных треков...');

      // ПРОВЕРКА ТОКЕНА
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('[likeService] ❌ Токен не найден!');
        throw new Error('Требуется авторизация');
      }

      console.log('[likeService] 🔑 Токен найден, длина:', token.length);

      // Правильный эндпоинт согласно документации API
      const endpoint = '/catalog/track/favorite/all/';

      console.log(`[likeService] 🔄 Используем эндпоинт: ${endpoint}`);

      const response = await fetchWithAuth<any>(endpoint, {
        method: 'GET',
      });

      console.log(`[likeService] ✅ Ответ получен:`, {
        type: typeof response,
        isArray: Array.isArray(response),
        keys: Object.keys(response || {}),
      });

      // Парсим ответ
      let tracks: Track[] = [];

      if (Array.isArray(response)) {
        tracks = response;
        console.log(
          `[likeService] ✅ Получен массив треков: ${tracks.length} шт`,
        );
      } else if (response && typeof response === 'object') {
        // Ищем треки в объекте
        const possibleKeys = [
          'tracks',
          'items',
          'data',
          'results',
          'favorites',
        ];
        for (const key of possibleKeys) {
          if (Array.isArray(response[key])) {
            tracks = response[key];
            console.log(
              `[likeService] ✅ Найден массив в ключе "${key}": ${tracks.length} шт`,
            );
            break;
          }
        }
      }

      // Если треки найдены, обрабатываем их
      if (tracks.length > 0) {
        console.log(`[likeService] 📊 Обработка ${tracks.length} треков...`);

        // Убедимся, что у всех треков есть обязательные поля
        const processedTracks = tracks.map((track, index) => ({
          _id: track._id || track.id || index + 1,
          name: track.name || `Трек #${track._id || index}`,
          author: track.author || 'Неизвестный исполнитель',
          album: track.album || 'Без альбома',
          duration_in_seconds:
            track.duration_in_seconds || track.duration || 180,
          release_date:
            track.release_date || new Date().toISOString().split('T')[0],
          genre: Array.isArray(track.genre)
            ? track.genre
            : [track.genre || 'Unknown'],
          logo: track.logo || null,
          track_file: track.track_file || '',
          stared_user: Array.isArray(track.stared_user)
            ? track.stared_user
            : [],
          likes_count: track.likes_count || 0,
          is_liked: track.is_liked !== undefined ? track.is_liked : true,
        }));

        // Логируем примеры треков
        console.log('[likeService] 📋 Примеры треков:');
        processedTracks
          .slice(0, Math.min(3, processedTracks.length))
          .forEach((track, i) => {
            console.log(
              `  ${i + 1}. "${track.name}" - ${track.author} (ID: ${track._id})`,
            );
          });

        return processedTracks;
      }

      // Если треки не найдены
      console.warn('[likeService] ⚠️ Не удалось получить треки');

      // Возвращаем тестовые данные для демонстрации
      if (process.env.NODE_ENV === 'development') {
        console.log('[likeService] 🧪 Возвращаем тестовые данные');
        return [
          {
            _id: 1,
            name: 'Bohemian Rhapsody',
            author: 'Queen',
            album: 'A Night at the Opera',
            duration_in_seconds: 354,
            release_date: '1975-10-31',
            genre: ['Rock'],
            logo: null,
            track_file: '',
            stared_user: [],
            likes_count: 1000,
            is_liked: true,
          },
          {
            _id: 2,
            name: 'Stairway to Heaven',
            author: 'Led Zeppelin',
            album: 'Led Zeppelin IV',
            duration_in_seconds: 482,
            release_date: '1971-11-08',
            genre: ['Rock'],
            logo: null,
            track_file: '',
            stared_user: [],
            likes_count: 850,
            is_liked: true,
          },
          {
            _id: 3,
            name: 'Hotel California',
            author: 'Eagles',
            album: 'Hotel California',
            duration_in_seconds: 391,
            release_date: '1977-02-22',
            genre: ['Rock'],
            logo: null,
            track_file: '',
            stared_user: [],
            likes_count: 920,
            is_liked: true,
          },
        ];
      }

      throw new Error('Не удалось получить избранные треки');
    } catch (error: any) {
      console.error(
        '[likeService] ❌ Критическая ошибка получения избранных треков:',
        error,
      );

      if (error?.status === 401) {
        console.log('[likeService] 🔐 Ошибка 401 - требуется авторизация');
        // Очищаем невалидные токены
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Редирект на страницу входа
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
      }

      throw error;
    }
  },

  // Добавить трек в избранное
  addToFavorites: async (trackId: number): Promise<LikeResponse> => {
    try {
      console.log(
        `[likeService] ➕ Добавление трека ${trackId} в избранное...`,
      );

      // Эндпоинт для добавления в избранное
      const response = await fetchWithAuth<LikeResponse>(
        `/catalog/track/${trackId}/favorite/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );

      console.log('[likeService] ✅ Успешно добавлено в избранное:', response);
      return response;
    } catch (error: any) {
      console.error('[likeService] ❌ Ошибка добавления в избранное:', error);
      throw error;
    }
  },

  // Удалить трек из избранного
  removeFromFavorites: async (trackId: number): Promise<LikeResponse> => {
    try {
      console.log(
        `[likeService] ➖ Удаление трека ${trackId} из избранного...`,
      );

      // Эндпоинт для удаления из избранного
      const response = await fetchWithAuth<LikeResponse>(
        `/catalog/track/${trackId}/favorite/`,
        {
          method: 'DELETE',
        },
      );

      console.log('[likeService] ✅ Успешно удалено из избранного:', response);
      return response;
    } catch (error: any) {
      console.error('[likeService] ❌ Ошибка удаления из избранного:', error);
      throw error;
    }
  },

  // Проверить, лайкнут ли трек
  checkIsLiked: async (trackId: number): Promise<boolean> => {
    try {
      console.log(`[likeService] ❓ Проверка лайка для трека ${trackId}...`);

      // Получаем все избранные треки и ищем нужный
      const favorites = await likeService.getFavoriteTracks();
      const isLiked = favorites.some((track) => track._id === trackId);

      console.log(`[likeService] ❓ Трек ${trackId} лайкнут:`, isLiked);
      return isLiked;
    } catch (error) {
      console.error('[likeService] ❌ Ошибка проверки лайка:', error);
      return false;
    }
  },

  // ДОБАВЛЕНА ФУНКЦИЯ toggleLike для совместимости
  toggleLike: async (
    trackId: number,
    shouldLike: boolean,
  ): Promise<LikeResponse> => {
    console.log(
      `[likeService] 🔄 Переключение лайка для трека ${trackId}, shouldLike: ${shouldLike}`,
    );

    if (shouldLike) {
      return await likeService.addToFavorites(trackId);
    } else {
      return await likeService.removeFromFavorites(trackId);
    }
  },
};

// Экспортируем по умолчанию для обратной совместимости
export default likeService;
