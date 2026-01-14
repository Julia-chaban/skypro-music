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
import { formatDuration } from '@/data/tracks';
import styles from './TrackItem.module.css';

interface TrackItemProps {
  track: Track;
  index: number;
  tracks: Track[];
}

export default function TrackItem({ track, index, tracks }: TrackItemProps) {
  const [isLiked, setIsLiked] = useState(false);

  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying } = useAppSelector((state) => state.tracks);

  const isCurrentTrack = currentTrack?._id === track._id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handleTrackClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isCurrentTrack) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setPlaylist(tracks));
      dispatch(setCurrentTrackIndex(index));
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }
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
            {/* Показываем ноту ТОЛЬКО если это НЕ текущий играющий трек */}
            {!isCurrentlyPlaying ? (
              <svg className={styles.track__titleSvg}>
                <use xlinkHref="/icon/note.svg"></use>
              </svg>
            ) : (
              /* Показываем пульсирующую точку ТОЛЬКО для текущего играющего трека */
              <div className={styles.track__titleImageDotPulsing} />
            )}
          </div>
          <div className={styles.track__titleText}>
            <a className={styles.track__titleLink} href="">
              {track.name}
              <span className={styles.track__titleSpan}></span>
            </a>
          </div>
        </div>

        <div className={styles.track__author}>
          <a className={styles.track__authorLink} href="">
            {track.author}
          </a>
        </div>

        <div className={styles.track__album}>
          <a className={styles.track__albumLink} href="">
            {track.album}
          </a>
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
