'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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

  // Получаем состояние из Redux
  const { likedTrackIds, trackLikesCount, favoriteTracks } = useAppSelector(
    (state) => state.tracks,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localIsLiked, setLocalIsLiked] = useState<boolean>(false);

  // ПРОСТАЯ ЛОГИКА определения лайка
  const isLiked = useMemo(() => {
    if (!track) return false;

    // Простая проверка: если трек в favoriteTracks - он лайкнут
    const isInFavorites = favoriteTracks.some(
      (favTrack) => favTrack._id === track._id,
    );

    return isInFavorites || localIsLiked || track.is_liked === true;
  }, [track, favoriteTracks, localIsLiked]);

  // Количество лайков
  const likesCount = useMemo(() => {
    if (!track) return 0;
    return trackLikesCount[track._id] !== undefined
      ? trackLikesCount[track._id]
      : track.likes_count || 0;
  }, [track, trackLikesCount]);

  // Проверка статуса лайка на сервере
  const checkLikeStatus = useCallback(async (): Promise<boolean> => {
    if (!track || !isAuthenticated) {
      return false;
    }

    try {
      const isLikedOnServer = await likeService.checkIsLiked(track._id);
      setLocalIsLiked(isLikedOnServer);
      return isLikedOnServer;
    } catch (err) {
      return isLiked;
    }
  }, [track, isAuthenticated, isLiked]);

  // Основная функция для тоггла лайка
  const toggleLike = useCallback(async (): Promise<void> => {
    if (!track) {
      setError('Трек не найден');
      return;
    }

    if (!isAuthenticated) {
      setError('Для добавления в избранное необходимо авторизоваться');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newIsLiked = !isLiked;

      // Обновляем локальное состояние
      setLocalIsLiked(newIsLiked);

      // Обновляем Redux
      dispatch(
        updateTrackLikes({
          trackId: track._id,
          likesCount: newIsLiked
            ? (track.likes_count || 0) + 1
            : Math.max(0, (track.likes_count || 0) - 1),
          isLiked: newIsLiked,
        }),
      );

      if (newIsLiked) {
        dispatch(addToFavorites(track));
      } else {
        dispatch(removeFromFavorites(track._id));
      }

      // Отправляем запрос на сервер
      if (newIsLiked) {
        await likeService.addToFavorites(track._id);
      } else {
        await likeService.removeFromFavorites(track._id);
      }
    } catch (err: any) {
      // Откатываем изменения
      setLocalIsLiked(isLiked);

      let errorMessage = 'Произошла ошибка при обновлении лайка';
      if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Ошибка соединения с сервером';
      } else if (err.status === 401) {
        errorMessage = 'Сессия истекла. Пожалуйста, войдите снова.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      dispatch(setFavoriteError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [track, isAuthenticated, isLiked, dispatch]);

  // Инициализируем localIsLiked при загрузке трека
  useEffect(() => {
    if (track) {
      const isInFavorites = favoriteTracks.some(
        (favTrack) => favTrack._id === track._id,
      );
      setLocalIsLiked(isInFavorites || track.is_liked === true);
    }
  }, [track, favoriteTracks]);

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
