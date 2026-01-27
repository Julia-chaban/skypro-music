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
import styles from './bar.module.css';
import ProgressBar from '../ProgressBar/ProgressBar';
import VolumeControl from '../VolumeControl/VolumeControl';

export default function Bar() {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
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

  // Инициализация аудио - только один раз
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('Аудио элемент инициализирован');

    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        dispatch(setDuration(audio.duration));
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

    const handleError = () => {
      console.error('Ошибка аудио элемента:', audio.error);
      dispatch(setIsPlaying(false));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [dispatch, isLooping]);

  // Установка трека и управление воспроизведением
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    let trackUrl = '';
    if (typeof currentTrack.track_file === 'string') {
      trackUrl = currentTrack.track_file;
    } else if (
      currentTrack.track_file &&
      typeof currentTrack.track_file === 'object'
    ) {
      trackUrl =
        (currentTrack.track_file as any).url ||
        (currentTrack.track_file as any).location ||
        (currentTrack.track_file as any).file ||
        '';
    }

    if (!trackUrl) {
      console.error('Некорректный URL трека:', currentTrack.track_file);
      return;
    }

    // Если это тот же трек, только обновляем состояние
    const currentSrc = audio.src;
    const newSrc = trackUrl;

    if (currentSrc && currentSrc === newSrc) {
      // Тот же трек, только обновляем воспроизведение если нужно
      if (isPlaying && audio.paused) {
        audio.play().catch((error) => {
          console.error('Ошибка воспроизведения:', error);
          dispatch(setIsPlaying(false));
        });
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
      return;
    }

    // Новый трек
    console.log('Загружаем новый трек:', currentTrack.name);
    audio.src = trackUrl;
    audio.volume = volume;
    audio.loop = isLooping;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Ошибка воспроизведения:', error);
        dispatch(setIsPlaying(false));
      });
    }
  }, [currentTrack, dispatch, volume, isLooping, isPlaying]);

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
        audio.play().catch((error) => {
          console.error('Ошибка воспроизведения:', error);
        });
        dispatch(setIsPlaying(true));
      }
    }
  }, [currentTrack, isPlaying, dispatch]);

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

  const handleLikeClick = useCallback(() => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  }, [isLiked, isDisliked]);

  const handleDislikeClick = useCallback(() => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  }, [isDisliked, isLiked]);

  // Форматирование времени
  const formatTime = useCallback((time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  // Определяем цвет иконок в зависимости от состояния
  const getRepeatIconColor = useCallback(() => {
    return isLooping ? '#ffffff' : '#696969';
  }, [isLooping]);

  const getShuffleIconColor = useCallback(() => {
    return isShuffling ? '#ffffff' : '#696969';
  }, [isShuffling]);

  // Мемоизация JSX
  const barContent = useMemo(
    () => (
      <>
        {/* Аудио элемент всегда на странице */}
        <audio ref={audioRef} preload="auto" />

        {/* ОДИН БАР - рендерится всегда */}
        <div className={styles.bar}>
          <div className={styles.bar__content}>
            {/* Прогресс-бар с использованием компонента ProgressBar - БЕЗ ЛИШНЕЙ ОБЕРТКИ */}
            {currentTrack && duration > 0 && (
              <ProgressBar
                max={duration}
                value={currentTime}
                step={0.1}
                onChange={handleProgressChange}
              />
            )}

            <div className={styles.bar__playerBlock}>
              <div className={styles.bar__player}>
                <div className={styles.player__controls}>
                  {/* КНОПКА ПРЕДЫДУЩЕГО ТРЕКА */}
                  <div
                    className={`${styles.player__btnPrev} ${styles.btn}`}
                    onClick={currentTrack ? handlePrevClick : undefined}
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
                    onClick={currentTrack ? handlePlayClick : undefined}
                  >
                    <svg
                      className={styles.player__btnPlaySvg}
                      style={{ fill: '#ffffff' }}
                    >
                      {currentTrack && isPlaying ? (
                        <use xlinkHref="/icon/pause.svg"></use>
                      ) : (
                        <use xlinkHref="/icon/play.svg"></use>
                      )}
                    </svg>
                  </div>
                  {/* КНОПКА СЛЕДУЮЩЕГО ТРЕКА */}
                  <div
                    className={`${styles.player__btnNext} ${styles.btn}`}
                    onClick={currentTrack ? handleNextClick : undefined}
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
                    onClick={currentTrack ? handleRepeatClick : undefined}
                  >
                    <svg
                      className={styles.player__btnRepeatSvg}
                      style={{
                        stroke: getRepeatIconColor(),
                        fill: isLooping ? '#ffffff' : 'transparent',
                      }}
                    >
                      <use xlinkHref="/icon/repeat.svg"></use>
                    </svg>
                  </div>
                  {/* КНОПКА ПЕРЕМЕШИВАНИЯ (SHUFFLE) */}
                  <div
                    className={`${styles.player__btnShuffle} ${styles.btnIcon}`}
                    onClick={currentTrack ? handleShuffleClick : undefined}
                  >
                    <svg
                      className={styles.player__btnShuffleSvg}
                      style={{
                        stroke: getShuffleIconColor(),
                        fill: isShuffling ? '#ffffff' : 'transparent',
                      }}
                    >
                      <use xlinkHref="/icon/shuffle.svg"></use>
                    </svg>
                  </div>
                </div>

                <div className={styles.player__trackPlay}>
                  <div className={styles.trackPlay__contain}>
                    <div className={styles.trackPlay__image}>
                      <svg className={styles.trackPlay__svg}>
                        <use xlinkHref="/icon/note.svg"></use>
                      </svg>
                    </div>
                    <div className={styles.trackPlay__author}>
                      <a className={styles.trackPlay__authorLink} href="">
                        {currentTrack
                          ? currentTrack.author || 'Неизвестный исполнитель'
                          : 'Ты та...'}
                      </a>
                    </div>
                    <div className={styles.trackPlay__album}>
                      <a className={styles.trackPlay__albumLink} href="">
                        {currentTrack
                          ? currentTrack.album || 'Неизвестный альбом'
                          : 'Баста'}
                      </a>
                    </div>
                  </div>

                  <div className={styles.trackPlay__dislike}>
                    <div
                      className={`${styles.trackPlay__like} ${styles.btnIcon} ${isLiked ? styles.active : ''}`}
                      onClick={handleLikeClick}
                    >
                      <svg className={styles.trackPlay__likeSvg}>
                        <use xlinkHref="/icon/like.svg"></use>
                      </svg>
                    </div>
                    <div
                      className={`${styles.trackPlay__dislike} ${styles.btnIcon} ${isDisliked ? styles.active : ''}`}
                      onClick={handleDislikeClick}
                    >
                      <svg className={styles.trackPlay__dislikeSvg}>
                        <use xlinkHref="/icon/dislike.svg"></use>
                      </svg>
                    </div>
                    {currentTrack && duration > 0 && (
                      <div className={styles.track__time}>
                        <span className={styles.track__timeText}>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.bar__volumeBlock}>
                <div className={styles.volume__content}>
                  <div className={styles.volume__image}>
                    <svg className={styles.volume__svg}>
                      <use xlinkHref="/icon/volume.svg"></use>
                    </svg>
                  </div>
                  <div className={styles.volume__progress}>
                    {/* Используем компонент VolumeControl */}
                    <VolumeControl
                      volume={volume}
                      onChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    ),
    [
      currentTrack,
      isPlaying,
      volume,
      currentTime,
      duration,
      isLooping,
      isShuffling,
      isLiked,
      isDisliked,
      getRepeatIconColor,
      getShuffleIconColor,
      handlePrevClick,
      handlePlayClick,
      handleNextClick,
      handleRepeatClick,
      handleShuffleClick,
      handleProgressChange,
      handleVolumeChange,
      handleLikeClick,
      handleDislikeClick,
      formatTime,
    ],
  );

  return barContent;
}
