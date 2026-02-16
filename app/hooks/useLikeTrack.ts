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
}

export const useLikeTrack = (track: Track | null): UseLikeTrackReturn => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();

  const { trackLikesCount, favoriteTracks } = useAppSelector(
    (state) => state.tracks,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLiked = useMemo(() => {
    if (!track) return false;
    return (
      favoriteTracks.some((favTrack) => favTrack._id === track._id) ||
      track.is_liked === true
    );
  }, [track, favoriteTracks]);

  const likesCount = useMemo(() => {
    if (!track) return 0;
    return trackLikesCount[track._id] !== undefined
      ? trackLikesCount[track._id]
      : track.likes_count || 0;
  }, [track, trackLikesCount]);

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

      if (newIsLiked) {
        await likeService.addToFavorites(track._id);
      } else {
        await likeService.removeFromFavorites(track._id);
      }
    } catch (err: unknown) {
      let errorMessage = 'Произошла ошибка при обновлении лайка';

      if (err instanceof Error) {
        if (err.message?.includes('Failed to fetch')) {
          errorMessage = 'Ошибка соединения с сервером';
        } else if ('status' in (err as any) && (err as any).status === 401) {
          errorMessage = 'Сессия истекла. Пожалуйста, войдите снова.';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      dispatch(setFavoriteError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [track, isAuthenticated, isLiked, dispatch]);

  return useMemo(
    () => ({
      isLiked,
      likesCount,
      isLoading,
      error,
      toggleLike,
    }),
    [isLiked, likesCount, isLoading, error, toggleLike],
  );
};
