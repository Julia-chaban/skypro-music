'use client';

import React, { useEffect, useState } from 'react';
import TrackItem from '@/components/TrackItem/TrackItem';
import { Track } from '@/sharedTypes/types';
import styles from './TrackList.module.css';

const TrackList: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/catalog/track/all/',
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // ДЕБАГ: проверяем структуру данных
      console.log('=== ПОЛУЧЕННЫЕ ДАННЫЕ С API ===');
      console.log('Всего треков:', data?.length);

      if (data && data.length > 0) {
        console.log('Первый трек:', data[0]);
        console.log('Все ключи первого трека:', Object.keys(data[0]));
        console.log('track_file первого трека:', data[0].track_file);
        console.log('Тип track_file:', typeof data[0].track_file);

        // Если track_file - объект, покажем его структуру
        if (data[0].track_file && typeof data[0].track_file === 'object') {
          console.log(
            'Ключи объекта track_file:',
            Object.keys(data[0].track_file),
          );
          console.log(
            'Значение track_file:',
            JSON.stringify(data[0].track_file, null, 2),
          );
        }
      }

      setTracks(data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      setError('Не удалось загрузить треки');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка треков...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
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
