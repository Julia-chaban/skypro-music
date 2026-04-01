'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useRef,
  useEffect,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/store/features/store';
import {
  setCurrentTrack,
  setIsPlaying,
  setPlaylist,
  setCurrentTrackIndex,
} from '@/store/features/trackSlice';
import { Track } from '@/types/track';
import { useFormatTime } from '@/app/hooks/useFormatTime';
import { useLikeTrack } from '@/app/hooks/useLikeTrack';
import styles from './TrackItem.module.css';

interface TrackItemProps {
  track: Track;
  index: number;
  tracks: Track[];
}

const TrackItem = ({ track, index, tracks }: TrackItemProps) => {
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying } = useAppSelector((state) => state.tracks);

  // Используем хук для работы с лайками
  const {
    isLiked,
    isLoading: likeLoading,
    error: likeError,
    toggleLike,
  } = useLikeTrack(track);
  const { formatDuration } = useFormatTime();

  const [showError, setShowError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isProcessingClick = useRef(false); // Защита от двойного клика
  const [isOnFavoritesPage, setIsOnFavoritesPage] = useState(false);

  // Определяем, находимся ли на странице избранного
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnFavoritesPage(window.location.pathname === '/favorites');
    }
  }, []);

  // Мемоизация вычисляемых значений
  const isCurrentTrack = useMemo(
    () => currentTrack?._id === track._id,
    [currentTrack, track],
  );
  const isCurrentlyPlaying = useMemo(
    () => isCurrentTrack && isPlaying,
    [isCurrentTrack, isPlaying],
  );

  // Мемоизация форматированной длительности
  const formattedDuration = useMemo(
    () => formatDuration(track.duration_in_seconds),
    [track.duration_in_seconds, formatDuration],
  );

  // Мемоизация класса для иконки
  const likeClassName = useMemo(() => {
    const classes = [styles.track__timeSvg];

    if (isAnimating) {
      classes.push(styles.animating);
    }

    return classes.join(' ');
  }, [isAnimating]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // Защита от двойного клика
      if (isProcessingClick.current) return;
      isProcessingClick.current = true;

      try {
        // Проверяем наличие корректного track_file
        const trackFile = track.track_file;
        if (!trackFile || typeof trackFile !== 'string') {
          console.warn(
            'Трек не может быть воспроизведен: отсутствует аудиофайл',
          );
          return;
        }

        if (isCurrentTrack) {
          // Тот же трек - просто переключаем воспроизведение
          dispatch(setIsPlaying(!isPlaying));
        } else {
          // Новый трек - устанавливаем его
          dispatch(setPlaylist(tracks));
          dispatch(setCurrentTrackIndex(index));
          dispatch(setCurrentTrack(track));
          dispatch(setIsPlaying(true));
        }
      } catch (error) {
        console.error('Ошибка при клике на трек:', error);
      } finally {
        // Сбрасываем флаг через небольшой таймаут
        setTimeout(() => {
          isProcessingClick.current = false;
        }, 300);
      }
    },
    [isCurrentTrack, isPlaying, dispatch, tracks, index, track],
  );

  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (likeLoading) return;

      // Запускаем анимацию
      setIsAnimating(true);

      try {
        await toggleLike();

        // Если мы на странице избранного и убираем лайк
        if (isOnFavoritesPage && isLiked) {
          // Трек будет автоматически удален из списка
          console.log('Трек удален из избранного на странице /favorites');
          // Redux обновит список через хуки и состояние
        }

        // Показываем ошибку, если она есть
        if (likeError) {
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
        }
      } catch (err) {
        console.error('Ошибка при обработке лайка:', err);
      } finally {
        // Останавливаем анимацию через 500ms
        setTimeout(() => setIsAnimating(false), 500);
      }
    },
    [toggleLike, likeError, likeLoading, isLiked, isOnFavoritesPage],
  );

  // Мемоизация JSX для иконки трека
  const trackIcon = useMemo(() => {
    if (!isCurrentlyPlaying) {
      return (
        <svg className={styles.track__titleSvg}>
          <use xlinkHref="/icon/note.svg"></use>
        </svg>
      );
    }
    return <div className={styles.track__titleImageDotPulsing} />;
  }, [isCurrentlyPlaying]);

  // Мемоизация JSX для ошибки
  const errorTooltip = useMemo(
    () =>
      showError && likeError ? (
        <div className={styles.errorTooltip}>{likeError}</div>
      ) : null,
    [showError, likeError],
  );

  // Дебаг информация
  console.log('TrackItem render:', {
    trackId: track._id,
    trackName: track.name,
    isLiked,
    likeLoading,
    likeError,
    isOnFavoritesPage,
  });

  return (
    <div className={styles.playlist__item} onClick={handleTrackClick}>
      <div className={styles.playlist__track}>
        <div className={styles.track__title}>
          <div className={styles.track__titleImage}>{trackIcon}</div>
          <div className={styles.track__titleText}>
            <span className={styles.track__titleLink}>
              {track.name}
              <span className={styles.track__titleSpan}></span>
            </span>
          </div>
        </div>

        <div className={styles.track__author}>
          <span className={styles.track__authorLink}>{track.author}</span>
        </div>

        <div className={styles.track__album}>
          <span className={styles.track__albumLink}>{track.album}</span>
        </div>

        <div className={styles.track__time}>
          <div className={styles.likeContainer}>
            <svg
              className={likeClassName}
              onClick={handleLikeClick}
              style={likeLoading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              title={
                isOnFavoritesPage
                  ? 'Удалить из избранного'
                  : isLiked
                    ? 'Убрать из избранного'
                    : 'Добавить в избранное'
              }
            >
              <use
                xlinkHref={isLiked ? '/icon/dislike.svg' : '/icon/like.svg'}
              ></use>
            </svg>

            {/* Сообщение об ошибки */}
            {errorTooltip}
          </div>

          <span className={styles.track__timeText}>{formattedDuration}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(TrackItem);
