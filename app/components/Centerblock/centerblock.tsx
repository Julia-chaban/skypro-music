'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import Filter from '../Filter/Filter';
import Track from '../TrackItem/TrackItem';
import { Track as TrackType } from '@/types/track';
import { setFilteredPlaylist, setPlaylist } from '@/store/features/trackSlice';
import { fetchAllTracks, fetchCollectionById } from '@/api/tracks';
import styles from './centerblock.module.css';


const SELECTION_NAMES: Record<string, string> = {
  '2': 'Плейлист дня',
  '3': '100 танцевальных хитов',
  '4': 'Инди-заряд',
};

export default function Centerblock() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collection');

  const [tracks, setTracks] = useState<TrackType[]>([]);
  const [collectionTitle, setCollectionTitle] = useState<string>('Треки');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchTracks = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        setSelectedArtists([]);
        setSelectedGenres([]);
        setSelectedYears([]);
        setSearchQuery('');

        let tracksArray: TrackType[] = [];
        let title = collectionId ? 'Загрузка подборки...' : 'Треки';

        if (collectionId) {
          try {
            const collectionData = await fetchCollectionById(
              collectionId,
              SELECTION_NAMES,
            );
            title = collectionData.title;
            tracksArray = collectionData.tracks;
          } catch {
            const errorMessage = 'Не удалось загрузить подборку';
            setError(`Не удалось загрузить подборку: ${errorMessage}`);
            tracksArray = [];
            title = 'Подборка';
          }
        } else {
          tracksArray = await fetchAllTracks();
          title = 'Треки';
        }

        setTracks(tracksArray);
        setCollectionTitle(title);
      } catch {
        setError('Произошла ошибка при загрузке данных');
        setTracks([]);
        setCollectionTitle(collectionId ? 'Подборка' : 'Треки');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [collectionId]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      if (
        selectedArtists.length === 0 &&
        selectedGenres.length === 0 &&
        selectedYears.length === 0
      ) {
        return tracks;
      }

      return tracks.filter((track) => {
        const artistMatch =
          selectedArtists.length === 0 ||
          selectedArtists.includes(track.author);

        const genreMatch =
          selectedGenres.length === 0 ||
          selectedGenres.some((g) => track.genre && track.genre.includes(g));

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

        return artistMatch && genreMatch && yearMatch;
      });
    }

    const query = searchQuery.toLowerCase().trim();

    return tracks.filter((track) => {
      const nameStartsWith = track.name?.toLowerCase().startsWith(query);
      const authorStartsWith = track.author?.toLowerCase().startsWith(query);
      const albumStartsWith = track.album?.toLowerCase().startsWith(query);

      return nameStartsWith || authorStartsWith || albumStartsWith;
    });
  }, [tracks, selectedArtists, selectedGenres, selectedYears, searchQuery]);

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

  const handleYearToggle = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    );
  };

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const handleRetry = () => {
    window.location.reload();
  };

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
            disabled
          />
        </div>

        <h2 className={styles.centerblock__h2}>{collectionTitle}</h2>

        <div className={styles.errorContainer}>
          <div className={styles.error}>
            <p className={styles.errorMessage}>{error}</p>
            <button onClick={handleRetry} className={styles.retryButton}>
              Попробовать снова
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
            disabled
          />
        </div>

        <h2 className={styles.centerblock__h2}>
          {collectionId ? 'Загрузка подборки...' : 'Загрузка треков...'}
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
              <p>Загрузка...</p>
            </div>
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
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <h2 className={styles.centerblock__h2}>
        {collectionId && tracks.length === 0
          ? `${collectionTitle} (пусто)`
          : collectionTitle}
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
              <p>
                {searchQuery
                  ? `По запросу "${searchQuery}" ничего не найдено`
                  : collectionId
                    ? 'В этой подборке пока нет треков'
                    : 'Треков не найдено'}
              </p>
              {(selectedArtists.length > 0 ||
                selectedGenres.length > 0 ||
                selectedYears.length > 0 ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedArtists([]);
                    setSelectedGenres([]);
                    setSelectedYears([]);
                    setSearchQuery('');
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
                key={track._id || `track-${index}`}
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
