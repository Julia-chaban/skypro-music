import { Track, LikeResponse } from '@/types/track';
import { fetchWithAuth, fetchApi } from '@/utils/api';

interface ApiResponse {
  tracks?: Track[];
  items?: Track[];
  data?: Track[];
  results?: Track[];
  favorites?: Track[];
  [key: string]: unknown;
}

export const likeService = {
  getFavoriteTracks: async (): Promise<Track[]> => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const endpoint = '/catalog/track/favorite/all/';

      const response = await fetchWithAuth<ApiResponse>(endpoint, {
        method: 'GET',
      });

      let tracks: Track[] = [];

      if (Array.isArray(response)) {
        tracks = response;
      } else if (response && typeof response === 'object') {
        const possibleKeys: (keyof ApiResponse)[] = [
          'tracks',
          'items',
          'data',
          'results',
          'favorites',
        ];
        for (const key of possibleKeys) {
          if (Array.isArray(response[key])) {
            tracks = response[key] as Track[];
            break;
          }
        }
      }

      if (tracks.length > 0) {
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

        return processedTracks;
      }

      throw new Error('Не удалось получить избранные треки');
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'status' in (error as any) &&
        (error as any).status === 401
      ) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
      }

      throw error;
    }
  },

  addToFavorites: async (trackId: number): Promise<LikeResponse> => {
    try {
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

      return response;
    } catch (error: unknown) {
      throw error;
    }
  },

  removeFromFavorites: async (trackId: number): Promise<LikeResponse> => {
    try {
      const response = await fetchWithAuth<LikeResponse>(
        `/catalog/track/${trackId}/favorite/`,
        {
          method: 'DELETE',
        },
      );

      return response;
    } catch (error: unknown) {
      throw error;
    }
  },

  checkIsLiked: async (trackId: number): Promise<boolean> => {
    try {
      const favorites = await likeService.getFavoriteTracks();
      const isLiked = favorites.some((track) => track._id === trackId);

      return isLiked;
    } catch (error: unknown) {
      return false;
    }
  },

  toggleLike: async (
    trackId: number,
    shouldLike: boolean,
  ): Promise<LikeResponse> => {
    if (shouldLike) {
      return await likeService.addToFavorites(trackId);
    } else {
      return await likeService.removeFromFavorites(trackId);
    }
  },
};

export default likeService;
