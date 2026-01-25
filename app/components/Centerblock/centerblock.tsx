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
  const [error, setError] = useState<string | null>(null);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        console.log('Fetching tracks...');
        setLoading(true);
        setError(null);

        const url = collectionId
          ? `https://webdev-music-003b5b991590.herokuapp.com/catalog/selection/${collectionId}/`
          : 'https://webdev-music-003b5b991590.herokuapp.com/catalog/track/all/';

        console.log('Fetching from URL:', url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data);

        // ИСПРАВЛЕНИЕ: Правильный парсинг данных
        let tracksArray: TrackType[] = [];

        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            // Если ответ - массив
            tracksArray = data;
          } else if (Array.isArray(data.data)) {
            // Если есть поле data с массивом (как в вашем API)
            tracksArray = data.data;
          } else if (Array.isArray(data.tracks)) {
            // Если есть поле tracks с массивом
            tracksArray = data.tracks;
          } else if (Array.isArray(data.results)) {
            // Если есть поле results
            tracksArray = data.results;
          } else {
            // Пробуем найти любой массив в объекте
            const arrays = Object.values(data).filter(Array.isArray);
            if (arrays.length > 0) {
              tracksArray = arrays[0] as TrackType[];
            } else {
              throw new Error('Неверный формат данных от сервера');
            }
          }
        }

        console.log('Parsed tracks array:', tracksArray);
        console.log('Number of tracks:', tracksArray.length);

        if (tracksArray.length === 0) {
          console.warn('No tracks found in API response');
        }

        setTracks(tracksArray);
      } catch (error: any) {
        console.error('Error fetching tracks:', error);
        setError(error.message || 'Не удалось загрузить треки');
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [collectionId]);

  const filteredTracks = useMemo(() => {
    console.log('Filtering tracks:', {
      total: tracks.length,
      selectedArtists,
      selectedGenres,
      selectedYears,
    });

    if (
      selectedArtists.length === 0 &&
      selectedGenres.length === 0 &&
      selectedYears.length === 0
    ) {
      return tracks;
    }

    return tracks.filter((track) => {
      const artistMatch =
        selectedArtists.length === 0 || selectedArtists.includes(track.author);

      const genreMatch =
        selectedGenres.length === 0 ||
        selectedGenres.some((g) => track.genre.includes(g));

      const yearMatch =
        selectedYears.length === 0 ||
        selectedYears.some((year) => {
          if (!track.release_date) return false;
          try {
            const trackYear = new Date(track.release_date)
              .getFullYear()
              .toString();
            return trackYear === year;
          } catch {
            return false;
          }
        });

      const isMatch = artistMatch && genreMatch && yearMatch;
      if (isMatch) {
        console.log('Track matches filter:', track.name);
      }

      return isMatch;
    });
  }, [tracks, selectedArtists, selectedGenres, selectedYears]);

  useEffect(() => {
    if (tracks.length > 0) {
      console.log('Dispatching playlist to Redux:', tracks.length, 'tracks');
      dispatch(setPlaylist(tracks));
    }
  }, [tracks, dispatch]);

  useEffect(() => {
    console.log(
      'Dispatching filtered playlist to Redux:',
      filteredTracks.length,
      'tracks',
    );
    dispatch(setFilteredPlaylist(filteredTracks));
  }, [filteredTracks, dispatch]);

  const handleArtistToggle = (artist: string) => {
    console.log('Toggling artist:', artist);
    setSelectedArtists((prev) =>
      prev.includes(artist)
        ? prev.filter((a) => a !== artist)
        : [...prev, artist],
    );
  };

  const handleGenreToggle = (genre: string) => {
    console.log('Toggling genre:', genre);
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleYearToggle = (year: string) => {
    console.log('Toggling year:', year);
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    );
  };

  // Добавьте обработку ошибок
  if (error) {
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

        <div className={styles.errorContainer}>
          <div className={styles.error}>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className={styles.loadingFilters}>Загрузка фильтров...</div>
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
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Загрузка треков...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering Centerblock with', tracks.length, 'tracks');

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
        selectedYears={selectedYears}
        onArtistToggle={handleArtistToggle}
        onGenreToggle={handleGenreToggle}
        onYearToggle={handleYearToggle}
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
          {filteredTracks.length === 0 ? (
            <div className={styles.empty}>
              <p>Треков не найдено</p>
              {(selectedArtists.length > 0 ||
                selectedGenres.length > 0 ||
                selectedYears.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedArtists([]);
                    setSelectedGenres([]);
                    setSelectedYears([]);
                  }}
                  className={styles.clearFiltersButton}
                >
                  Очистить фильтры
                </button>
              )}
            </div>
          ) : (
            filteredTracks.map((track, index) => (
              <Track
                key={track._id}
                track={track}
                index={index}
                tracks={filteredTracks}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
