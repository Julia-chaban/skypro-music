'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/features/store';
import {
  setCurrentTrack,
  setIsPlaying,
  setPlaylist,
  setCurrentTrackIndex,
} from '@/store/features/trackSlice';
import { Track } from '@/types/track';
import { formatDuration, getYearFromDate } from '@/data/tracks';
import styles from './TrackItem.module.css';

interface TrackItemProps {
  track: Track;
  index: number;
  tracks: Track[];
}

export default function TrackItem({ track, index, tracks }: TrackItemProps) {
  const year = getYearFromDate(track.release_date);
  const [isLiked, setIsLiked] = useState(false);

  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying } = useAppSelector((state) => state.tracks);

  const isCurrentTrack = currentTrack?._id === track._id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handleTrackClick = (e: React.MouseEvent) => {
    e.preventDefault();

    console.log('Кликнули трек:', track.name);
    console.log('track_file:', track.track_file);
    console.log('Тип track_file:', typeof track.track_file);

    dispatch(setPlaylist(tracks));
    dispatch(setCurrentTrackIndex(index));
    dispatch(setCurrentTrack(track));
    dispatch(setIsPlaying(true));
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div className={styles.playlist__item} onClick={handleTrackClick}>
      <div className={styles.playlist__track}>
        <div className={styles.track__title}>
          <div className={styles.track__titleImage}>
            {/* Фиолетовая точка для текущего трека */}
            {isCurrentTrack && (
              <div
                className={`${styles.track__titleImageDot} ${isCurrentlyPlaying ? styles.track__titleImageDotPulsing : ''}`}
              />
            )}
            <svg className={styles.track__titleSvg}>
              <use xlinkHref="/icon/note.svg"></use>
            </svg>
          </div>
          <div className={styles.track__titleText}>
            <div className={styles.track__titleLink}>
              {track.name}
              <span className={styles.track__mobileInfo}>
                {track.author} • {year}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.track__author}>
          <div className={styles.track__authorLink}>{track.author}</div>
        </div>
        <div className={styles.track__album}>
          <div className={styles.track__albumLink}>{track.album}</div>
        </div>
        <div className={styles.track__year}>
          <span className={styles.track__yearText}>{year}</span>
        </div>
        <div className={styles.track__time}>
          <svg
            className={`${styles.track__timeSvg} ${isLiked ? styles.track__timeSvgLiked : ''}`}
            onClick={handleLikeClick}
          >
            <use xlinkHref="/icon/like.svg"></use>
          </svg>
          <span className={styles.track__timeText}>
            {formatDuration(track.duration_in_seconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
