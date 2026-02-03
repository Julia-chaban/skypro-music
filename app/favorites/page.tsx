// app/favorites/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import MainLayout from '@/app/components/MainLayout/MainLayout';
import TrackItem from '@/app/components/TrackItem/TrackItem';
import { Track } from '@/types/track';
import { likeService } from '@/app/services/likeService';
import { useAppDispatch, useAppSelector } from '@/store/features/store';
import {
  setFavoriteTracks,
  setFavoriteLoading,
  setFavoriteError,
  removeFromFavorites,
} from '@/store/features/trackSlice';
import styles from './page.module.css';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const dispatch = useAppDispatch();

  const { favoriteTracks, isFavoriteLoading, favoriteError } = useAppSelector(
    (state) => state.tracks,
  );

  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Редирект если не авторизован - мемоизируем
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, authLoading, router]);

  // Загрузка избранных треков - мемоизируем
  const loadFavoriteTracks = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      dispatch(setFavoriteLoading(true));
      setLocalError(null);

      const tracks = await likeService.getFavoriteTracks();
      dispatch(setFavoriteTracks(tracks));
    } catch (error: any) {
      const errorMessage =
        error.message || 'Не удалось загрузить избранные треки';
      dispatch(setFavoriteError(errorMessage));
      setLocalError(errorMessage);
      console.error('Ошибка загрузки избранных треков:', error);
    } finally {
      dispatch(setFavoriteLoading(false));
      setLocalLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  // Первоначальная загрузка
  useEffect(() => {
    if (isAuthenticated) {
      loadFavoriteTracks();
    }
  }, [isAuthenticated, loadFavoriteTracks]);

  // Обработчик удаления трека из избранного - мемоизируем
  const handleRemoveFromFavorites = useCallback(
    async (trackId: number) => {
      try {
        // Оптимистичное обновление UI
        dispatch(removeFromFavorites(trackId));

        // Отправляем запрос на сервер
        await likeService.removeFromFavorites(trackId);
      } catch (error: any) {
        // Откатываем изменения при ошибке
        await loadFavoriteTracks();

        const errorMessage =
          error.message || 'Не удалось удалить трек из избранного';
        setLocalError(errorMessage);
        console.error('Ошибка удаления из избранного:', error);
      }
    },
    [dispatch, loadFavoriteTracks],
  );

  // Форматирование времени прослушивания - мемоизируем
  const formatTotalDuration = useMemo(() => {
    const totalSeconds = favoriteTracks.reduce(
      (total, track) => total + track.duration_in_seconds,
      0,
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  }, [favoriteTracks]);

  // Мемоизируем JSX для состояния загрузки
  const loadingContent = useMemo(
    () => (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Загрузка избранных треков...</p>
        </div>
      </MainLayout>
    ),
    [],
  );

  if (authLoading || localLoading) {
    return loadingContent;
  }

  if (!isAuthenticated) {
    return null; // Редирект уже произойдет
  }

  // Мемоизируем JSX для заголовка
  const headerContent = useMemo(
    () => (
      <div className={styles.favoritesHeader}>
        <h1 className={styles.favoritesTitle}>Мои треки</h1>
        <div className={styles.favoritesStats}>
          <span className={styles.tracksCount}>
            {favoriteTracks.length} треков
          </span>
          <span className={styles.duration}>{formatTotalDuration}</span>
        </div>
      </div>
    ),
    [favoriteTracks.length, formatTotalDuration],
  );

  // Мемоизируем JSX для ошибки
  const errorContent = useMemo(
    () =>
      (favoriteError || localError) && (
        <div className={styles.errorAlert}>
          <p>{favoriteError || localError}</p>
          <button onClick={loadFavoriteTracks} className={styles.retryButton}>
            Повторить
          </button>
        </div>
      ),
    [favoriteError, localError, loadFavoriteTracks],
  );

  // Мемоизируем JSX для пустого состояния
  const emptyStateContent = useMemo(
    () =>
      favoriteTracks.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg>
              <use xlinkHref="/icon/like.svg"></use>
            </svg>
          </div>
          <h2 className={styles.emptyStateTitle}>Нет избранных треков</h2>
          <p className={styles.emptyStateText}>
            Добавляйте треки в избранное, нажимая на иконку сердца
          </p>
        </div>
      ),
    [favoriteTracks.length],
  );

  // Мемоизируем JSX для списка треков
  const trackListContent = useMemo(
    () =>
      favoriteTracks.length > 0 && (
        <div className={styles.favoritesList}>
          <div className={styles.trackListHeader}>
            <div className={styles.headerNumber}>№</div>
            <div className={styles.headerTitle}>НАЗВАНИЕ</div>
            <div className={styles.headerAlbum}>АЛЬБОМ</div>
            <div className={styles.headerActions}>ДЕЙСТВИЯ</div>
            <div className={styles.headerDuration}>
              <svg className={styles.durationIcon}>
                <use xlinkHref="/icon/time.svg"></use>
              </svg>
            </div>
          </div>

          <div className={styles.trackListContent}>
            {favoriteTracks.map((track, index) => (
              <div key={track._id} className={styles.favoriteTrackItem}>
                <TrackItem
                  track={track}
                  index={index}
                  tracks={favoriteTracks}
                />

                <div className={styles.trackActions}>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveFromFavorites(track._id)}
                    title="Удалить из избранного"
                    aria-label="Удалить из избранного"
                  >
                    <svg className={styles.removeIcon}>
                      <use xlinkHref="/icon/delete.svg"></use>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    [favoriteTracks, handleRemoveFromFavorites],
  );

  return (
    <MainLayout pageTitle="Мои треки">
      <div className={styles.favoritesPage}>
        {headerContent}
        {errorContent}
        {emptyStateContent}
        {trackListContent}
      </div>
    </MainLayout>
  );
}
