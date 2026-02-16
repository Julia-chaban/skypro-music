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
import { fixTrackUrl } from '@/utils/trackHelpers';
import styles from './bar.module.css';
import ProgressBar from '../ProgressBar/ProgressBar';
import VolumeControl from '../VolumeControl/VolumeControl';

// Константы
const LIKE_ANIMATION_DURATION = 500;
const LIKE_ERROR_TIMEOUT = 3000;
const AUDIO_READY_STATE = 2;

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

  const formattedCurrentTime = useMemo(
    () => formatTime(currentTime),
    [currentTime, formatTime],
  );
  const formattedDuration = useMemo(
    () => formatTime(duration),
    [duration, formatTime],
  );

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

  const isPrevDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isPlayDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isNextDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isRepeatDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isShuffleDisabled = useMemo(() => !currentTrack, [currentTrack]);
  const isLikeDisabled = useMemo(
    () => !currentTrack || likeLoading,
    [currentTrack, likeLoading],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
      if (!isLooping) {
        dispatch(nextTrack());
      }
    };

    const handleError = () => {
      dispatch(setIsPlaying(false));
      setIsAudioReady(false);
    };

    const handleCanPlay = () => {
      setIsAudioReady(true);
    };

    const handleWaiting = () => {
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const trackUrl = fixTrackUrl(currentTrack.track_file);

    if (!trackUrl) {
      dispatch(setIsPlaying(false));
      return;
    }

    const currentSrc = audio.src;
    const newSrc = trackUrl;

    if (currentSrc && currentSrc === newSrc) {
      if (isPlaying && audio.paused) {
        if (isAudioReady && audio.readyState >= AUDIO_READY_STATE) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              dispatch(setIsPlaying(false));
            });
          }
        }
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
      return;
    }

    setIsAudioReady(false);

    audio.src = trackUrl;
    audio.volume = volume;
    audio.loop = isLooping;

    const handleCanPlayThrough = () => {
      setIsAudioReady(true);
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            dispatch(setIsPlaying(false));
          });
        }
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [currentTrack, dispatch, volume, isLooping, isPlaying, isAudioReady]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const handlePlayClick = useCallback(() => {
    if (!currentTrack) return;
    const audio = audioRef.current;

    if (audio) {
      if (isPlaying) {
        audio.pause();
        dispatch(setIsPlaying(false));
      } else {
        if (isAudioReady && audio.readyState >= AUDIO_READY_STATE) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                dispatch(setIsPlaying(true));
              })
              .catch(() => {
                dispatch(setIsPlaying(false));
              });
          }
        } else {
          const handleCanPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  dispatch(setIsPlaying(true));
                })
                .catch(() => {
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
          setTimeout(() => setShowLikeError(false), LIKE_ERROR_TIMEOUT);
        }
      } catch {
        
      } finally {
        setTimeout(() => setIsLikeAnimating(false), LIKE_ANIMATION_DURATION);
      }
    },
    [currentTrack, toggleLike, likeError, likeLoading],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      dispatch(setVolume(newVolume));
    },
    [dispatch],
  );

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!duration || !audioRef.current) return;

      const newTime = parseFloat(e.target.value);

      dispatch(setProgress(newTime));
      audioRef.current.currentTime = newTime;
    },
    [duration, dispatch],
  );

  const likeClassName = useMemo(() => {
    const classes = [styles.trackPlay__like, styles.btnIcon];

    if (isLikeAnimating) {
      classes.push(styles.animating);
    }

    return classes.join(' ');
  }, [isLikeAnimating]);

  const likeButtonStyle = useMemo(() => {
    if (likeLoading) {
      return { opacity: 0.5, cursor: 'not-allowed' };
    }
    return {};
  }, [likeLoading]);

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

  const playIcon = useMemo(
    () =>
      currentTrack && isPlaying ? (
        <use xlinkHref="/icon/pause.svg"></use>
      ) : (
        <use xlinkHref="/icon/play.svg"></use>
      ),
    [currentTrack, isPlaying],
  );

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

  const likeErrorTooltip = useMemo(
    () =>
      showLikeError && likeError ? (
        <div className={styles.barErrorTooltip}>{likeError}</div>
      ) : null,
    [showLikeError, likeError],
  );

  const playerControls = useMemo(
    () => (
      <div className={styles.player__controls}>
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
        <div
          className={`${styles.player__btnRepeat} ${styles.btnIcon}`}
          onClick={!isRepeatDisabled ? handleRepeatClick : undefined}
          style={isRepeatDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
        >
          <svg className={styles.player__btnRepeatSvg} style={repeatIconStyle}>
            <use xlinkHref="/icon/repeat.svg"></use>
          </svg>
        </div>
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

  const barContent = useMemo(
    () => (
      <>
        <audio ref={audioRef} preload="auto" />
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
