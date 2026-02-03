// hooks/useLikeTrack.ts
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/features/store';
import { likeService } from '@/app/services/likeService';
import { Track } from '@/types/track';
import {
  addToFavorites,
  removeFromFavorites,
  updateTrackLikes,
  setFavoriteError,
} from '@/store/features/trackSlice';
import { useAuth } from '@/app/context/AuthContext';

interface UseLikeTrackReturn {
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
  checkLikeStatus: () => Promise<boolean>;
}

export const useLikeTrack = (track: Track | null): UseLikeTrackReturn => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();

  // Получаем состояние из Redux с мемоизацией
  const { likedTrackIds, trackLikesCount } = useAppSelector(
    (state) => state.tracks,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Мемоизируем проверку лайка (теперь проверяем массив)
  const isLiked = useMemo(() => {
    if (!track) return false;
    return likedTrackIds.includes(track._id);
  }, [track, likedTrackIds]);

  // Мемоизируем количество лайков
  const likesCount = useMemo(() => {
    if (!track) return 0;
    return trackLikesCount[track._id] || track.likes_count || 0;
  }, [track, trackLikesCount]);

  // Мемоизируем проверку статуса лайка на сервере
  const checkLikeStatus = useCallback(async (): Promise<boolean> => {
    if (!track || !isAuthenticated) return false;

    try {
      return await likeService.checkIsLiked(track._id);
    } catch (err) {
      console.error('Ошибка проверки статуса лайка:', err);
      return false;
    }
  }, [track, isAuthenticated]);

  // Мемоизируем основную функцию для тоггла лайка
  const toggleLike = useCallback(async (): Promise<void> => {
    if (!track || !isAuthenticated) {
      setError('Для добавления в избранное необходимо авторизоваться');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Оптимистичное обновление UI
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked
        ? likesCount + 1
        : Math.max(0, likesCount - 1);

      // Сразу обновляем состояние в Redux
      dispatch(
        updateTrackLikes({
          trackId: track._id,
          likesCount: newLikesCount,
          isLiked: newIsLiked,
        }),
      );

      if (newIsLiked) {
        dispatch(addToFavorites(track));
      } else {
        dispatch(removeFromFavorites(track._id));
      }

      // Отправляем запрос на сервер
      await likeService.toggleLike(track._id, !newIsLiked);
    } catch (err: any) {
      // Откатываем изменения при ошибке
      dispatch(
        updateTrackLikes({
          trackId: track._id,
          likesCount: likesCount,
          isLiked: isLiked,
        }),
      );

      if (isLiked) {
        dispatch(addToFavorites(track));
      } else {
        dispatch(removeFromFavorites(track._id));
      }

      // Устанавливаем ошибку
      const errorMessage =
        err.message || 'Произошла ошибка при обновлении лайка';
      setError(errorMessage);
      dispatch(setFavoriteError(errorMessage));

      console.error('Ошибка при тоггле лайка:', err);
    } finally {
      setIsLoading(false);
    }
  }, [track, isAuthenticated, isLiked, likesCount, dispatch]);

  return useMemo(
    () => ({
      isLiked,
      likesCount,
      isLoading,
      error,
      toggleLike,
      checkLikeStatus,
    }),
    [isLiked, likesCount, isLoading, error, toggleLike, checkLikeStatus],
  );
};

// Хук для работы с избранными треками с оптимизацией
export const useFavorites = () => {
  const dispatch = useAppDispatch();
  const { favoriteTracks, isFavoriteLoading, favoriteError } = useAppSelector(
    (state) => state.tracks,
  );
  const { isAuthenticated } = useAuth();

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      return [];
    }

    try {
      const tracks = await likeService.getFavoriteTracks();
      return tracks;
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error);
      throw error;
    }
  }, [isAuthenticated]);

  return useMemo(
    () => ({
      favoriteTracks,
      isLoading: isFavoriteLoading,
      error: favoriteError,
      loadFavorites,
    }),
    [favoriteTracks, isFavoriteLoading, favoriteError, loadFavorites],
  );
};
