// services/likeService.ts
import { Track, LikeResponse, FavoriteTracksResponse } from '@/types/track';
import { fetchWithAuth } from '@/utils/api';

export const likeService = {
  // Получить все избранные треки пользователя
  getFavoriteTracks: async (): Promise<Track[]> => {
    try {
      const response = await fetchWithAuth<FavoriteTracksResponse>(
        '/catalog/track/favorite/all/',
        {
          method: 'GET',
        },
      );
      return response.tracks || [];
    } catch (error) {
      console.error('Ошибка получения избранных треков:', error);
      // Возвращаем пустой массив при ошибке
      return [];
    }
  },

  // Добавить трек в избранное
  addToFavorites: async (trackId: number): Promise<LikeResponse> => {
    try {
      const response = await fetchWithAuth<LikeResponse>(
        `/catalog/track/${trackId}/favorite/`,
        {
          method: 'POST',
        },
      );
      return response;
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error);
      throw error;
    }
  },

  // Удалить трек из избранного
  removeFromFavorites: async (trackId: number): Promise<LikeResponse> => {
    try {
      const response = await fetchWithAuth<LikeResponse>(
        `/catalog/track/${trackId}/favorite/`,
        {
          method: 'DELETE',
        },
      );
      return response;
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error);
      throw error;
    }
  },

  // Проверить, лайкнут ли трек
  checkIsLiked: async (trackId: number): Promise<boolean> => {
    try {
      const favorites = await likeService.getFavoriteTracks();
      return favorites.some((track) => track._id === trackId);
    } catch (error) {
      console.error('Ошибка проверки лайка:', error);
      // Вместо того чтобы бросать ошибку, возвращаем false
      return false;
    }
  },

  // Тоггл лайка (добавить/удалить)
  toggleLike: async (
    trackId: number,
    isCurrentlyLiked: boolean,
  ): Promise<LikeResponse> => {
    if (isCurrentlyLiked) {
      return await likeService.removeFromFavorites(trackId);
    } else {
      return await likeService.addToFavorites(trackId);
    }
  },
};
