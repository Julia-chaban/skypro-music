'use client';

import React, { useEffect, useState } from 'react';
import TrackItem from '@/app/components/TrackItem/TrackItem';
import { Track } from '@/types/track';
import styles from './TrackList.module.css';

interface TrackListProps {
  collectionId?: string | null;
  tracks?: Track[];
}

const TrackList: React.FC<TrackListProps> = ({
  collectionId,
  tracks: propTracks,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Если треки переданы из родителя (из подборки через Centerblock)
    if (propTracks && propTracks.length > 0) {
      setTracks(propTracks);
      setLoading(false);
      return;
    }

    // Если нет переданных треков, загружаем сами
    fetchTracks();
  }, [collectionId, propTracks]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Если передан collectionId, загружаем треки из подборки
      if (collectionId) {
        const response = await fetch(
          `https://webdev-music-003b5b991590.herokuapp.com/catalog/selection/${collectionId}/`,
        );

        if (!response.ok) {
          throw new Error('Не удалось загрузить подборку');
        }

        const data = await response.json();
        setTracks(data.tracks || []);
      } else {
        // Иначе загружаем все треки
        const response = await fetch(
          'https://webdev-music-003b5b991590.herokuapp.com/catalog/track/all/',
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTracks(data);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setError('Не удалось загрузить треки');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchTracks();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Загрузка треков...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div>{error}</div>
        <button onClick={handleRetry} className={styles.retryButton}>
          Попробовать снова
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return <div className={styles.empty}>Треков не найдено</div>;
  }

  return (
    <div className={styles.trackList}>
      <div className={styles.trackListHeader}>
        <div className={styles.headerNumber}>№</div>
        <div className={styles.headerTitle}>НАЗВАНИЕ</div>
        <div className={styles.headerAlbum}>АЛЬБОМ</div>
        <div className={styles.headerDuration}>
          <svg className={styles.durationIcon}>
            <use xlinkHref="/icon/time.svg"></use>
          </svg>
        </div>
      </div>

      <div className={styles.trackListContent}>
        {tracks.map((track, index) => (
          <TrackItem
            key={track._id}
            track={track}
            index={index}
            tracks={tracks}
          />
        ))}
      </div>
    </div>
  );
};

export default TrackList;
