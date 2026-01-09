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
      dispatch(nextTrack());
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
  }, [dispatch]);

  // Установка трека
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
    dispatch(togglePlaying());
  }, [currentTrack, dispatch]);

  const handleNextClick = useCallback(() => {
    dispatch(nextTrack());
  }, [dispatch]);

  const handlePrevClick = useCallback(() => {
    dispatch(prevTrack());
  }, [dispatch]);

  const handleRepeatClick = useCallback(() => {
    dispatch(toggleLooping());
  }, [dispatch]);

  const handleShuffleClick = useCallback(() => {
    dispatch(toggleShuffling());
  }, [dispatch]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseInt(e.target.value) / 100;
      dispatch(setVolume(newVolume));
    },
    [dispatch],
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration || !audioRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;

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

  // Мемоизация JSX для предотвращения лишних ререндеров
  const barContent = useMemo(
    () => (
      <>
        {/* Аудио элемент всегда на странице */}
        <audio ref={audioRef} preload="auto" />

        {/* ОДИН БАР - рендерится всегда */}
        <div className={styles.bar}>
          <div className={styles.bar__content}>
            <div
              className={styles.bar__playerProgress}
              onClick={currentTrack ? handleProgressClick : undefined}
            >
              {currentTrack && (
                <div
                  className={styles.bar__playerProgressFilled}
                  style={{
                    width:
                      duration > 0
                        ? `${(currentTime / duration) * 100}%`
                        : '0%',
                  }}
                />
              )}
            </div>

            <div className={styles.bar__playerBlock}>
              <div className={styles.bar__player}>
                <div className={styles.player__controls}>
                  <div
                    className={`${styles.player__btnPrev} ${styles.btn}`}
                    onClick={currentTrack ? handlePrevClick : undefined}
                  >
                    <svg className={styles.player__btnPrevSvg}>
                      <use xlinkHref="/icon/prev.svg"></use>
                    </svg>
                  </div>
                  <div
                    className={`${styles.player__btnPlay} ${styles.btn}`}
                    onClick={currentTrack ? handlePlayClick : undefined}
                  >
                    <svg className={styles.player__btnPlaySvg}>
                      {currentTrack && isPlaying ? (
                        <use xlinkHref="/icon/pause.svg"></use>
                      ) : (
                        <use xlinkHref="/icon/play.svg"></use>
                      )}
                    </svg>
                  </div>
                  <div
                    className={`${styles.player__btnNext} ${styles.btn}`}
                    onClick={currentTrack ? handleNextClick : undefined}
                  >
                    <svg className={styles.player__btnNextSvg}>
                      <use xlinkHref="/icon/next.svg"></use>
                    </svg>
                  </div>
                  <div
                    className={`${styles.player__btnRepeat} ${styles.btnIcon} ${isLooping ? styles.active : ''}`}
                    onClick={currentTrack ? handleRepeatClick : undefined}
                  >
                    <svg className={styles.player__btnRepeatSvg}>
                      <use xlinkHref="/icon/repeat.svg"></use>
                    </svg>
                  </div>
                  <div
                    className={`${styles.player__btnShuffle} ${styles.btnIcon} ${isShuffling ? styles.active : ''}`}
                    onClick={currentTrack ? handleShuffleClick : undefined}
                  >
                    <svg className={styles.player__btnShuffleSvg}>
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

                  <div className={styles.trackPlay__likeDis}>
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
                    <input
                      className={`${styles.volume__progressLine} ${styles.btn}`}
                      type="range"
                      name="range"
                      min="0"
                      max="100"
                      value={volume * 100}
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
      handleProgressClick,
      handlePrevClick,
      handlePlayClick,
      handleNextClick,
      handleRepeatClick,
      handleShuffleClick,
      handleVolumeChange,
      handleLikeClick,
      handleDislikeClick,
    ],
  );

  return barContent;
}
