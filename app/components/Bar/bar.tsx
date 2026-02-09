// app/components/Bar/Bar.tsx
'use client';

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/store/features/store';
import {
  setIsPlaying,
  setCurrentTime,
  setDuration,
  setVolume,
  nextTrack,
  prevTrack,
  togglePlaying,
  setProgress,
  toggleLooping,
  toggleShuffling,
} from '@/store/features/trackSlice';
import { useLikeTrack } from '@/app/hooks/useLikeTrack';
import { useFormatTime } from '@/app/hooks/useFormatTime';
import styles from './bar.module.css';
import ProgressBar from '../ProgressBar/ProgressBar';
import VolumeControl from '../VolumeControl/VolumeControl';

export default function Bar() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const dispatch = useAppDispatch();

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    isLooping,
    isShuffling,
  } = useAppSelector((state) => state.tracks);

  // Используем хук для лайков
  const {
    isLiked,
    isLoading: likeLoading,
    error: likeError,
    toggleLike,
  } = useLikeTrack(currentTrack);
  const { formatTime } = useFormatTime();

  const [showLikeError, setShowLikeError] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Мемоизация форматированных значений времени
  const formattedCurrentTime = useMemo(
    () => formatTime(currentTime),
    [currentTime, formatTime],
  );
  const formattedDuration = useMemo(
    () => formatTime(duration),
    [duration, formatTime],
  );

  // Мемоизация стилей иконок
  const repeatIconStyle = useMemo(
    () => ({
      stroke: isLooping ? '#ffffff' : '#696969',
      fill: isLooping ? '#ffffff' : 'transparent',
    }),
    [isLooping],
  );

  const shuffleIconStyle = useMemo(
    () => ({
      stroke: isShuffling ? '#ffffff' : '#696969',
      fill: isShuffling ? '#ffffff' : 'transparent',
    }),
    [isShuffling],
  );

  // Мемоизация состояний кнопок
  const isPrevDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isPlayDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isNextDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isRepeatDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isShuffleDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isLikeDisabled = useMemo(
    () => !currentTrack || likeLoading,
    [currentTrack, likeLoading],
  );

  // Функция для исправления URL трека
  const fixTrackUrl = useCallback((trackFile: string | any): string => {
    if (typeof trackFile !== 'string') {
      console.error('Некорректный тип track_file:', typeof trackFile);
      return '';
    }

    let trackUrl = trackFile.trim();

    // Если URL уже полный, возвращаем как есть
    if (
      trackUrl.startsWith('http://') ||
      trackUrl.startsWith('https://') ||
      trackUrl.startsWith('/') ||
      trackUrl.startsWith('blob:')
    ) {
      return trackUrl;
    }

    // Если это относительный путь, добавляем базовый URL
    if (trackUrl) {
      // Убираем лишние слэши в начале
      trackUrl = trackUrl.replace(/^\/+/, '');

      // Проверяем, содержит ли уже путь media/
      if (trackUrl.startsWith('media/')) {
        return `https://webdev-music-003b5b991590.herokuapp.com/${trackUrl}`;
      } else {
        return `https://webdev-music-003b5b991590.herokuapp.com/media/${trackUrl}`;
      }
    }

    return '';
  }, []);

  // Инициализация аудио - только один раз
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('Аудио элемент инициализирован');

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
        setIsAudioReady(true);
      }
    };

    const handleTimeUpdate = () => {
      if (!isNaN(audio.currentTime)) {
        dispatch(setCurrentTime(audio.currentTime));
      }
    };

    const handleEnded = () => {
      // АВТОМАТИЧЕСКИЙ ПЕРЕХОД К СЛЕДУЮЩЕМУ ТРЕКУ
      if (!isLooping) {
        dispatch(nextTrack());
      }
    };

    const handleError = (e: Event) => {
      const audioElement = e.target as HTMLAudioElement;
      console.error('Ошибка аудио элемента:', audioElement.error);
      dispatch(setIsPlaying(false));
      setIsAudioReady(false);
    };

    const handleCanPlay = () => {
      setIsAudioReady(true);
      console.log('Аудио готово к воспроизведению');
    };

    const handleWaiting = () => {
      console.log('Аудио ожидает загрузки');
      setIsAudioReady(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [dispatch, isLooping]);

  // Установка трека и управление воспроизведением
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Исправляем URL трека
    const trackUrl = fixTrackUrl(currentTrack.track_file);

    if (!trackUrl) {
      console.error('Некорректный URL трека для:', currentTrack.name);
      dispatch(setIsPlaying(false));
      return;
    }

    console.log('Загружаем трек:', currentTrack.name, 'URL:', trackUrl);

    // Если это тот же трек, только обновляем состояние
    const currentSrc = audio.src;
    const newSrc = trackUrl;

    if (currentSrc && currentSrc === newSrc) {
      // Тот же трек, только обновляем воспроизведение если нужно
      if (isPlaying && audio.paused) {
        // Проверяем, готово ли аудио к воспроизведению
        if (isAudioReady && audio.readyState >= 2) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error('Ошибка воспроизведения:', error);
              dispatch(setIsPlaying(false));
            });
          }
        }
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
      return;
    }

    // Новый трек - сбрасываем флаг готовности
    setIsAudioReady(false);

    // Загружаем новый трек
    audio.src = trackUrl;
    audio.volume = volume;
    audio.loop = isLooping;

    // Устанавливаем обработчик для воспроизведения после загрузки
    const handleCanPlayThrough = () => {
      setIsAudioReady(true);
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Ошибка воспроизведения нового трека:', error);
            dispatch(setIsPlaying(false));
          });
        }
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [
    currentTrack,
    dispatch,
    volume,
    isLooping,
    isPlaying,
    isAudioReady,
    fixTrackUrl,
  ]);

  // Управление громкостью
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Управление зацикливанием
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Обработчики с useCallback для стабильности
  const handlePlayClick = useCallback(() => {
    if (!currentTrack) return;
    const audio = audioRef.current;

    if (audio) {
      if (isPlaying) {
        // Если трек играет, ставим на паузу
        audio.pause();
        dispatch(setIsPlaying(false));
      } else {
        // Если трек на паузе, продолжаем воспроизведение
        // Проверяем, готово ли аудио
        if (isAudioReady && audio.readyState >= 2) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                dispatch(setIsPlaying(true));
              })
              .catch((error) => {
                console.error('Ошибка воспроизведения:', error);
                dispatch(setIsPlaying(false));
              });
          }
        } else {
          // Если аудио не готово, ждем
          const handleCanPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  dispatch(setIsPlaying(true));
                })
                .catch((error) => {
                  console.error('Ошибка воспроизведения:', error);
                  dispatch(setIsPlaying(false));
                });
            }
            audio.removeEventListener('canplay', handleCanPlay);
          };
          audio.addEventListener('canplay', handleCanPlay);
        }
      }
    }
  }, [currentTrack, isPlaying, dispatch, isAudioReady]);

  const handleNextClick = useCallback(() => {
    // РУЧНОЙ ПЕРЕХОД К СЛЕДУЮЩЕМУ ТРЕКУ
    dispatch(nextTrack());
  }, [dispatch]);

  const handlePrevClick = useCallback(() => {
    // РУЧНОЙ ПЕРЕХОД К ПРЕДЫДУЩЕМУ ТРЕКУ
    dispatch(prevTrack());
  }, [dispatch]);

  const handleRepeatClick = useCallback(() => {
    // ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ РЕЖИМА ЗАЦИКЛИВАНИЯ ТРЕКА
    dispatch(toggleLooping());
  }, [dispatch]);

  const handleShuffleClick = useCallback(() => {
    // ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ РЕЖИМА ПЕРЕМЕШИВАНИЯ (SHUFFLE)
    dispatch(toggleShuffling());
  }, [dispatch]);

  // Обработчик лайка для прогресс-бара
  const handleLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!currentTrack || likeLoading) return;

      setIsLikeAnimating(true);

      try {
        await toggleLike();

        if (likeError) {
          setShowLikeError(true);
          setTimeout(() => setShowLikeError(false), 3000);
        }
      } catch (err) {
        console.error('Ошибка при обработке лайка:', err);
      } finally {
        setTimeout(() => setIsLikeAnimating(false), 500);
      }
    },
    [currentTrack, toggleLike, likeError, likeLoading],
  );

  // Обработчик для VolumeControl
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      dispatch(setVolume(newVolume));
    },
    [dispatch],
  );

  // Обработчик для ProgressBar компонента
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!duration || !audioRef.current) return;

      const newTime = parseFloat(e.target.value);

      dispatch(setProgress(newTime));
      audioRef.current.currentTime = newTime;
    },
    [duration, dispatch],
  );

  // Мемоизация класса для лайка
  const likeClassName = useMemo(() => {
    const classes = [styles.trackPlay__like, styles.btnIcon];

    if (isLikeAnimating) {
      classes.push(styles.animating);
    }

    return classes.join(' ');
  }, [isLikeAnimating]);

  // Мемоизация стиля для лайка
  const likeButtonStyle = useMemo(() => {
    if (likeLoading) {
      return { opacity: 0.5, cursor: 'not-allowed' };
    }
    return {};
  }, [likeLoading]);

  // Мемоизация JSX для прогресс-бара
  const progressBar = useMemo(
    () =>
      currentTrack && duration > 0 ? (
        <ProgressBar
          max={duration}
          value={currentTime}
          step={0.1}
          onChange={handleProgressChange}
        />
      ) : null,
    [currentTrack, duration, currentTime, handleProgressChange],
  );

  // Мемоизация JSX для иконки воспроизведения
  const playIcon = useMemo(
    () =>
      currentTrack && isPlaying ? (
        <use xlinkHref="/icon/pause.svg"></use>
      ) : (
        <use xlinkHref="/icon/play.svg"></use>
      ),
    [currentTrack, isPlaying],
  );

  // Мемоизация JSX для информации о треке
  const trackInfo = useMemo(
    () => ({
      author: currentTrack
        ? currentTrack.author || 'Неизвестный исполнитель'
        : 'Ты та...',
      album: currentTrack
        ? currentTrack.album || 'Неизвестный альбом'
        : 'Баста',
    }),
    [currentTrack],
  );

  // Мемоизация JSX для времени трека
  const trackTime = useMemo(
    () =>
      currentTrack && duration > 0 ? (
        <div className={styles.track__time}>
          <span className={styles.track__timeText}>
            {formattedCurrentTime} / {formattedDuration}
          </span>
        </div>
      ) : null,
    [currentTrack, duration, formattedCurrentTime, formattedDuration],
  );

  // Мемоизация JSX для ошибки лайка
  const likeErrorTooltip = useMemo(
    () =>
      showLikeError && likeError ? (
        <div className={styles.barErrorTooltip}>{likeError}</div>
      ) : null,
    [showLikeError, likeError],
  );

  // Мемоизация JSX для контролов
  const playerControls = useMemo(
    () => (
      <div className={styles.player__controls}>
        {/* КНОПКА ПРЕДЫДУЩЕГО ТРЕКА */}
        <div
          className={`${styles.player__btnPrev} ${styles.btn}`}
          onClick={!isPrevDisabled ? handlePrevClick : undefined}
          style={isPrevDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
        >
          <svg
            className={styles.player__btnPrevSvg}
            style={{ fill: '#ffffff', stroke: '#ffffff' }}
          >
            <use xlinkHref="/icon/prev.svg"></use>
          </svg>
        </div>
        {/* КНОПКА ВОСПРОИЗВЕДЕНИЯ/ПАУЗЫ */}
        <div
          className={`${styles.player__btnPlay} ${styles.btn}`}
          onClick={!isPlayDisabled ? handlePlayClick : undefined}
          style={isPlayDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
        >
          <svg
            className={styles.player__btnPlaySvg}
            style={{ fill: '#ffffff' }}
          >
            {playIcon}
          </svg>
        </div>
        {/* КНОПКА СЛЕДУЮЩЕГО ТРЕКА */}
        <div
          className={`${styles.player__btnNext} ${styles.btn}`}
          onClick={!isNextDisabled ? handleNextClick : undefined}
          style={isNextDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
        >
          <svg
            className={styles.player__btnNextSvg}
            style={{ fill: '#ffffff', stroke: '#ffffff' }}
          >
            <use xlinkHref="/icon/next.svg"></use>
          </svg>
        </div>
        {/* КНОПКА ПОВТОРА (ЗАЦИКЛИВАНИЕ) */}
        <div
          className={`${styles.player__btnRepeat} ${styles.btnIcon}`}
          onClick={!isRepeatDisabled ? handleRepeatClick : undefined}
          style={isRepeatDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
        >
          <svg className={styles.player__btnRepeatSvg} style={repeatIconStyle}>
            <use xlinkHref="/icon/repeat.svg"></use>
          </svg>
        </div>
        {/* КНОПКА ПЕРЕМЕШИВАНИЯ (SHUFFLE) */}
        <div
          className={`${styles.player__btnShuffle} ${styles.btnIcon}`}
          onClick={!isShuffleDisabled ? handleShuffleClick : undefined}
          style={isShuffleDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
        >
          <svg
            className={styles.player__btnShuffleSvg}
            style={shuffleIconStyle}
          >
            <use xlinkHref="/icon/shuffle.svg"></use>
          </svg>
        </div>
      </div>
    ),
    [
      isPrevDisabled,
      handlePrevClick,
      isPlayDisabled,
      handlePlayClick,
      playIcon,
      isNextDisabled,
      handleNextClick,
      isRepeatDisabled,
      handleRepeatClick,
      repeatIconStyle,
      isShuffleDisabled,
      handleShuffleClick,
      shuffleIconStyle,
    ],
  );

  // Мемоизация JSX для информации о треке
  const trackPlayInfo = useMemo(
    () => (
      <div className={styles.player__trackPlay}>
        <div className={styles.trackPlay__contain}>
          <div className={styles.trackPlay__image}>
            <svg className={styles.trackPlay__svg}>
              <use xlinkHref="/icon/note.svg"></use>
            </svg>
          </div>
          <div className={styles.trackPlay__author}>
            <a className={styles.trackPlay__authorLink} href="">
              {trackInfo.author}
            </a>
          </div>
          <div className={styles.trackPlay__album}>
            <a className={styles.trackPlay__albumLink} href="">
              {trackInfo.album}
            </a>
          </div>
        </div>

        <div className={styles.trackPlay__dislike}>
          {/* Иконка лайка/дизлайка */}
          <div
            className={likeClassName}
            onClick={!isLikeDisabled ? handleLikeClick : undefined}
            style={likeButtonStyle}
          >
            <svg className={styles.trackPlay__likeSvg}>
              <use
                xlinkHref={isLiked ? '/icon/dislike.svg' : '/icon/like.svg'}
              ></use>
            </svg>
          </div>

          {likeErrorTooltip}
          {trackTime}
        </div>
      </div>
    ),
    [
      trackInfo,
      likeClassName,
      isLikeDisabled,
      handleLikeClick,
      likeButtonStyle,
      isLiked,
      likeErrorTooltip,
      trackTime,
    ],
  );

  // Мемоизация JSX для контроля громкости
  const volumeControl = useMemo(
    () => (
      <div className={styles.bar__volumeBlock}>
        <div className={styles.volume__content}>
          <div className={styles.volume__image}>
            <svg className={styles.volume__svg}>
              <use xlinkHref="/icon/volume.svg"></use>
            </svg>
          </div>
          <div className={styles.volume__progress}>
            <VolumeControl volume={volume} onChange={handleVolumeChange} />
          </div>
        </div>
      </div>
    ),
    [volume, handleVolumeChange],
  );

  // Мемоизация основного контента
  const barContent = useMemo(
    () => (
      <>
        {/* Аудио элемент всегда на странице */}
        <audio ref={audioRef} preload="auto" />

        {/* ОДИН БАР - рендерится всегда */}
        <div className={styles.bar}>
          <div className={styles.bar__content}>
            {progressBar}
            <div className={styles.bar__playerBlock}>
              <div className={styles.bar__player}>
                {playerControls}
                {trackPlayInfo}
              </div>
              {volumeControl}
            </div>
          </div>
        </div>
      </>
    ),
    [progressBar, playerControls, trackPlayInfo, volumeControl],
  );

  return barContent;
}
