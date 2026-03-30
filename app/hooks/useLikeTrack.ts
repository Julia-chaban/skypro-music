// hooks/useLikeTrack.ts
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
  setFavoriteTracks,
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
  const { likedTrackIds, trackLikesCount, favoriteTracks } = useAppSelector(
    (state) => state.tracks,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // При монтировании компонента проверяем статус лайка - ТОЛЬКО если авторизован
  useEffect(() => {
    const checkLikes = async () => {
      if (isAuthenticated && !hasChecked) {
        try {
          // Загружаем избранные треки один раз при загрузке приложения
          const favorites = await likeService.getFavoriteTracks();
          dispatch(setFavoriteTracks(favorites));
          setHasChecked(true);
        } catch (error) {
          console.error('Ошибка загрузки избранных треков:', error);
          setHasChecked(true);
        }
      } else if (!isAuthenticated) {
        // Если не авторизован, просто отмечаем что проверка выполнена
        setHasChecked(true);
      }
    };

    checkLikes();
  }, [isAuthenticated, hasChecked, dispatch]);

  // Мемоизируем проверку лайка
  const isLiked = useMemo(() => {
    if (!track) return false;

    // Проверяем в нескольких местах для надежности
    return (
      likedTrackIds.includes(track._id) ||
      favoriteTracks.some((favTrack) => favTrack._id === track._id)
    );
  }, [track, likedTrackIds, favoriteTracks]);

  // Мемоизируем количество лайков
  const likesCount = useMemo(() => {
    if (!track) return 0;
    return trackLikesCount[track._id] || track.likes_count || 0;
  }, [track, trackLikesCount]);

  // Мемоизируем проверку статуса лайка на сервере
  const checkLikeStatus = useCallback(async (): Promise<boolean> => {
    if (!track || !isAuthenticated) {
      // Если не авторизован, возвращаем false
      return false;
    }

    try {
      // Используем существующий метод из likeService
      const isLikedOnServer = await likeService.checkIsLiked(track._id);

      // Синхронизируем с локальным состоянием
      if (isLikedOnServer && !likedTrackIds.includes(track._id)) {
        // Добавляем в локальное состояние
        dispatch(
          updateTrackLikes({
            trackId: track._id,
            likesCount: track.likes_count || 1,
            isLiked: true,
          }),
        );
      } else if (!isLikedOnServer && likedTrackIds.includes(track._id)) {
        // Удаляем из локального состояния если на сервере нет лайка
        dispatch(
          updateTrackLikes({
            trackId: track._id,
            likesCount: Math.max(0, (track.likes_count || 1) - 1),
            isLiked: false,
          }),
        );
      }

      return isLikedOnServer;
    } catch (err) {
      console.error('Ошибка проверки статуса лайка:', err);
      // При ошибке возвращаем текущее локальное состояние
      return isLiked;
    }
  }, [track, isAuthenticated, likedTrackIds, isLiked, dispatch]);

  // Мемоизируем основную функцию для тоггла лайка
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
