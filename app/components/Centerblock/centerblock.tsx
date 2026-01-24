'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import Filter from '../Filter/Filter';
import Track from '../TrackItem/TrackItem';
import { Track as TrackType } from '@/types/track';
import { setFilteredPlaylist, setPlaylist } from '@/store/features/trackSlice';
import styles from './centerblock.module.css';

export default function Centerblock() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collection');

  const [tracks, setTracks] = useState<TrackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const url = collectionId
          ? `https://webdev-music-003b5b991590.herokuapp.com/catalog/selection/${collectionId}/`
          : 'https://webdev-music-003b5b991590.herokuapp.com/catalog/track/all/';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const tracksArray = Array.isArray(data) ? data : data.tracks || [];

        setTracks(tracksArray);
      } catch (error) {
        console.error('Error fetching tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [collectionId]);

  const filteredTracks = useMemo(() => {
    if (selectedArtists.length === 0 && selectedGenres.length === 0) {
      return tracks;
    }

    return tracks.filter((track) => {
      const artistMatch =
        selectedArtists.length === 0 || selectedArtists.includes(track.author);
      const genreMatch =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => track.genre.includes(g));
      return artistMatch && genreMatch;
    });
  }, [tracks, selectedArtists, selectedGenres]);

  useEffect(() => {
    if (tracks.length > 0) {
      dispatch(setPlaylist(tracks));
    }
  }, [tracks, dispatch]);

  useEffect(() => {
    dispatch(setFilteredPlaylist(filteredTracks));
  }, [filteredTracks, dispatch]);

  const handleArtistToggle = (artist: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artist)
        ? prev.filter((a) => a !== artist)
        : [...prev, artist],
    );
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  if (loading) {
    return (
      <div className={styles.centerblock}>
        <div className={styles.centerblock__search}>
          <svg className={styles.search__svg}>
            <use xlinkHref="/icon/search.svg"></use>
          </svg>
          <input
            className={styles.search__text}
            type="search"
            placeholder="Поиск"
            name="search"
          />
        </div>

        <h2 className={styles.centerblock__h2}>
          {collectionId ? 'Подборка' : 'Треки'}
        </h2>

        <div className={styles.centerblock__filter}>
          <div className={styles.filter__title}>Искать по:</div>
          {/* Фильтры будут загружены после получения треков */}
        </div>

        <div className={styles.centerblock__content}>
          <div className={styles.content__title}>
            <div className={`${styles.playlistTitle__col} ${styles.col01}`}>
              ТРЕК
            </div>
            <div className={`${styles.playlistTitle__col} ${styles.col02}`}>
              ИСПОЛНИТЕЛЬ
            </div>
            <div className={`${styles.playlistTitle__col} ${styles.col03}`}>
              АЛЬБОМ
            </div>
            <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
              <svg className={styles.playlistTitle__svg}>
                <use xlinkHref="/icon/watch.svg"></use>
              </svg>
            </div>
          </div>
          <div className={styles.content__playlist}>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centerblock}>
      <div className={styles.centerblock__search}>
        <svg className={styles.search__svg}>
          <use xlinkHref="/icon/search.svg"></use>
        </svg>
        <input
          className={styles.search__text}
          type="search"
          placeholder="Поиск"
          name="search"
        />
      </div>

      <h2 className={styles.centerblock__h2}>
        {collectionId ? 'Подборка' : 'Треки'}
      </h2>

      <Filter
        tracks={tracks}
        selectedArtists={selectedArtists}
        selectedGenres={selectedGenres}
        onArtistToggle={handleArtistToggle}
        onGenreToggle={handleGenreToggle}
      />

      <div className={styles.centerblock__content}>
        <div className={styles.content__title}>
          <div className={`${styles.playlistTitle__col} ${styles.col01}`}>
            ТРЕК
          </div>
          <div className={`${styles.playlistTitle__col} ${styles.col02}`}>
            ИСПОЛНИТЕЛЬ
          </div>
          <div className={`${styles.playlistTitle__col} ${styles.col03}`}>
            АЛЬБОМ
          </div>
          <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
            <svg className={styles.playlistTitle__svg}>
              <use xlinkHref="/icon/watch.svg"></use>
            </svg>
          </div>
        </div>
        <div className={styles.content__playlist}>
          {filteredTracks.map((track, index) => (
            <Track
              key={track._id}
              track={track}
              index={index}
              tracks={filteredTracks}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
