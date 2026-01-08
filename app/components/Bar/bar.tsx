'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { formatDuration, getYearFromDate } from '@/data/tracks';
import styles from './bar.module.css';

export default function Bar() {
  const [isMobile, setIsMobile] = useState(false);
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

  // Проверка мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Инициализация аудио и обработчиков событий
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

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

  // Установка трека и управление воспроизведением
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;

    // Получаем URL трека из объекта или строки
    let trackUrl = currentTrack.track_file;
    if (trackUrl && typeof trackUrl === 'object') {
      // Если track_file объект, пытаемся извлечь URL
      if (trackUrl.url && typeof trackUrl.url === 'string') {
        trackUrl = trackUrl.url;
      } else if (trackUrl.location && typeof trackUrl.location === 'string') {
        trackUrl = trackUrl.location;
      } else if (trackUrl.file && typeof trackUrl.file === 'string') {
        trackUrl = trackUrl.file;
      } else {
        console.error(
          'Не удалось извлечь URL из track_file:',
          currentTrack.track_file,
        );
        return;
      }
    }

    if (typeof trackUrl !== 'string' || !trackUrl.trim()) {
      console.error('Некорректный URL трека:', trackUrl);
      return;
    }

    // Устанавливаем новый источник
    audio.src = trackUrl;
    audio.volume = volume;
    audio.loop = isLooping;

    // Загружаем и воспроизводим если нужно
    audio.load();

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Ошибка воспроизведения:', error);
          dispatch(setIsPlaying(false));
        });
      }
    }
  }, [currentTrack, dispatch, volume, isLooping]);

  // Управление воспроизведением/паузой
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Ошибка воспроизведения:', error);
          dispatch(setIsPlaying(false));
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, dispatch]);

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

  // Обработчики кликов
  const handlePlayClick = () => {
    if (!currentTrack) return;
    dispatch(togglePlaying());
  };

  const handleNextClick = () => {
    dispatch(nextTrack());
  };

  const handlePrevClick = () => {
    dispatch(prevTrack());
  };

  const handleRepeatClick = () => {
    dispatch(toggleLooping());
  };

  const handleShuffleClick = () => {
    dispatch(toggleShuffling());
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value) / 100;
    dispatch(setVolume(newVolume));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    dispatch(setProgress(newTime));
    audioRef.current.currentTime = newTime;
  };

  const handleLikeClick = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislikeClick = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  // Форматирование времени
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Если нет текущего трека, показываем пустой плеер
  if (!currentTrack) {
    return (
      <div className={styles.bar}>
        <div className={styles.bar__content}>
          <div className={styles.bar__playerProgress}></div>
          <div className={styles.bar__playerBlock}>
            <div className={styles.bar__player}>
              <div className={styles.player__controls}>
                <div className={`${styles.player__btnPrev} ${styles.btn}`}>
                  <svg className={styles.player__btnPrevSvg}>
                    <use xlinkHref="/icon/prev.svg"></use>
                  </svg>
                </div>
                <div className={`${styles.player__btnPlay} ${styles.btn}`}>
                  <svg className={styles.player__btnPlaySvg}>
                    <use xlinkHref="/icon/play.svg"></use>
                  </svg>
                </div>
                <div className={`${styles.player__btnNext} ${styles.btn}`}>
                  <svg className={styles.player__btnNextSvg}>
                    <use xlinkHref="/icon/next.svg"></use>
                  </svg>
                </div>
                {!isMobile && (
                  <>
                    <div
                      className={`${styles.player__btnRepeat} ${styles.btnIcon}`}
                    >
                      <svg className={styles.player__btnRepeatSvg}>
                        <use xlinkHref="/icon/repeat.svg"></use>
                      </svg>
                    </div>
                    <div
                      className={`${styles.player__btnShuffle} ${styles.btnIcon}`}
                    >
                      <svg className={styles.player__btnShuffleSvg}>
                        <use xlinkHref="/icon/shuffle.svg"></use>
                      </svg>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.player__trackPlay}>
                <div className={styles.trackPlay__contain}>
                  <div className={styles.trackPlay__image}>
                    <svg className={styles.trackPlay__svg}>
                      <use xlinkHref="/icon/note.svg"></use>
                    </svg>
                  </div>
                  <div className={styles.trackPlay__author}>
                    <div className={styles.trackPlay__authorLink}>...</div>
                  </div>
                  <div className={styles.trackPlay__album}>
                    <div className={styles.trackPlay__albumLink}>...</div>
                  </div>
                </div>

                <div className={styles.trackPlay__likeDis}>
                  <div
                    className={`${styles.trackPlay__like} ${styles.btnIcon}`}
                  >
                    <svg className={styles.trackPlay__likeSvg}>
                      <use xlinkHref="/icon/like.svg"></use>
                    </svg>
                  </div>
                  <div
                    className={`${styles.trackPlay__dislike} ${styles.btnIcon}`}
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
                    aria-label="Громкость"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Скрытый аудио элемент */}
      <audio ref={audioRef} preload="auto" />

      <div className={styles.bar}>
        <div className={styles.bar__content}>
          <div
            className={styles.bar__playerProgress}
            onClick={handleProgressClick}
          >
            <div
              className={styles.bar__playerProgressFilled}
              style={{
                width:
                  duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
              }}
            />
          </div>

          <div className={styles.bar__playerBlock}>
            <div className={styles.bar__player}>
              <div className={styles.player__controls}>
                <div
                  className={`${styles.player__btnPrev} ${styles.btn}`}
                  onClick={handlePrevClick}
                >
                  <svg className={styles.player__btnPrevSvg}>
                    <use xlinkHref="/icon/prev.svg"></use>
                  </svg>
                </div>
                <div
                  className={`${styles.player__btnPlay} ${styles.btn}`}
                  onClick={handlePlayClick}
                >
                  <svg className={styles.player__btnPlaySvg}>
                    {isPlaying ? (
                      <use xlinkHref="/icon/pause.svg"></use>
                    ) : (
                      <use xlinkHref="/icon/play.svg"></use>
                    )}
                  </svg>
                </div>
                <div
                  className={`${styles.player__btnNext} ${styles.btn}`}
                  onClick={handleNextClick}
                >
                  <svg className={styles.player__btnNextSvg}>
                    <use xlinkHref="/icon/next.svg"></use>
                  </svg>
                </div>
                {!isMobile && (
                  <>
                    <div
                      className={`${styles.player__btnRepeat} ${styles.btnIcon} ${isLooping ? styles.active : ''}`}
                      onClick={handleRepeatClick}
                    >
                      <svg className={styles.player__btnRepeatSvg}>
                        <use xlinkHref="/icon/repeat.svg"></use>
                      </svg>
                    </div>
                    <div
                      className={`${styles.player__btnShuffle} ${styles.btnIcon} ${isShuffling ? styles.active : ''}`}
                      onClick={handleShuffleClick}
                    >
                      <svg className={styles.player__btnShuffleSvg}>
                        <use xlinkHref="/icon/shuffle.svg"></use>
                      </svg>
                    </div>
                  </>
                )}
              </div>

              <div className={styles.player__trackPlay}>
                <div className={styles.trackPlay__contain}>
                  <div className={styles.trackPlay__image}>
                    {currentTrack.logo ? (
                      <img
                        src={currentTrack.logo}
                        alt={currentTrack.name}
                        className={styles.trackPlay__imageLogo}
                      />
                    ) : (
                      <svg className={styles.trackPlay__svg}>
                        <use xlinkHref="/icon/note.svg"></use>
                      </svg>
                    )}
                  </div>
                  <div className={styles.trackPlay__author}>
                    <div
                      className={styles.trackPlay__authorLink}
                      title={currentTrack.author}
                    >
                      {currentTrack.author}
                    </div>
                  </div>
                  <div className={styles.trackPlay__album}>
                    <div
                      className={styles.trackPlay__albumLink}
                      title={currentTrack.album}
                    >
                      {currentTrack.album}
                    </div>
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
                    aria-label="Громкость"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
