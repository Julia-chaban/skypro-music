'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatDuration, getYearFromDate } from '@/data/tracks';
import styles from './Track.module.css';

interface TrackProps {
  track: {
    _id: number;
    name: string;
    author: string;
    album: string;
    release_date: string;
    duration_in_seconds: number;
  };
  isPlaying?: boolean;
  isCurrent?: boolean;
}

export default function Track({
  track,
  isPlaying = false,
  isCurrent = false,
}: TrackProps) {
  const year = getYearFromDate(track.release_date);
  const [isLiked, setIsLiked] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
  };

  return (
    <div className={styles.playlist__item}>
      <div className={styles.playlist__track}>
        <div className={styles.track__title}>
          <div className={styles.track__titleImage}>
            {/* Фиолетовая точка для текущего трека */}
            {isCurrent && (
              <div
                className={`${styles.track__titleImageDot} ${isPlaying ? styles.track__titleImageDotPulsing : ''}`}
              />
            )}
            <svg className={styles.track__titleSvg}>
              <use xlinkHref="/icon/note.svg"></use>
            </svg>
          </div>
          <div className={styles.track__titleText}>
            <Link className={styles.track__titleLink} href="#">
              {track.name}
              <span className={styles.track__mobileInfo}>
                {track.author} • {year}
              </span>
            </Link>
          </div>
        </div>
        <div className={styles.track__author}>
          <Link className={styles.track__authorLink} href="#">
            {track.author}
          </Link>
        </div>
        <div className={styles.track__album}>
          <Link className={styles.track__albumLink} href="#">
            {track.album}
          </Link>
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
