'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import MainLayout from '@/app/components/MainLayout/MainLayout';
import Filter from '@/app/components/Filter/Filter';
import TrackItem from '@/app/components/TrackItem/TrackItem';
import { useAppDispatch, useAppSelector } from '@/store/features/store';
import {
  setFilteredPlaylist,
  setPlaylist,
  setFavoriteTracks,
  setFavoriteLoading,
  setFavoriteError,
} from '@/store/features/trackSlice';
import { Track } from '@/types/track';
import styles from './page.module.css';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const dispatch = useAppDispatch();

  const { favoriteTracks, isFavoriteLoading } = useAppSelector(
    (state) => state.tracks,
  );

  const [error, setError] = useState<string | null>(null);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        const timer = setTimeout(() => {
          if (!isAuthenticated && !redirecting) {
            setRedirecting(true);
            router.push('/auth/signin');
          }
        }, 500);

        return () => clearTimeout(timer);
      } else {
        setRedirecting(true);
        router.push('/auth/signin');
      }
    } else {
      setRedirecting(false);
    }
  }, [isAuthenticated, authLoading, router, redirecting]);

  const loadFavoriteTracks = async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    try {
      dispatch(setFavoriteLoading(true));
      setError(null);

      const { likeService } = await import('@/app/services/likeService');
      const tracks = await likeService.getFavoriteTracks();

      if (Array.isArray(tracks)) {
        dispatch(setFavoriteTracks(tracks));
      } else {
        dispatch(setFavoriteTracks([]));
      }
    } catch {
      let errorMessage = 'Не удалось загрузить избранные треки';

      dispatch(setFavoriteError(errorMessage));
      setError(errorMessage);
      dispatch(setFavoriteTracks([]));
    } finally {
      dispatch(setFavoriteLoading(false));
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading && !redirecting) {
      loadFavoriteTracks();
    }
  }, [isAuthenticated, authLoading, redirecting]);

  useEffect(() => {
    if (favoriteTracks.length > 0) {
      dispatch(setPlaylist(favoriteTracks));
    }
  }, [favoriteTracks, dispatch]);

  const filteredTracks = useMemo(() => {
    let result = favoriteTracks || [];

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (track) =>
          (track.name && track.name.toLowerCase().includes(query)) ||
          (track.author && track.author.toLowerCase().includes(query)) ||
          (track.album && track.album.toLowerCase().includes(query)),
      );
    }

    if (
      selectedArtists.length === 0 &&
      selectedGenres.length === 0 &&
      selectedYears.length === 0
    ) {
      return result;
    }

    return result.filter((track) => {
      const artistMatch =
        selectedArtists.length === 0 ||
        (track.author && selectedArtists.includes(track.author));

      const genreMatch =
        selectedGenres.length === 0 ||
        (track.genre &&
          selectedGenres.some((g) => {
            if (Array.isArray(track.genre)) {
              return track.genre.includes(g);
            } else if (typeof track.genre === 'string') {
              return track.genre === g;
            }
            return false;
          }));

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
  }, [
    favoriteTracks,
    searchQuery,
    selectedArtists,
    selectedGenres,
    selectedYears,
  ]);

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

  const handleRetry = () => {
    loadFavoriteTracks();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value || '');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  if (authLoading || redirecting) {
    return (
      <MainLayout pageTitle="Мои треки">
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
              disabled
            />
          </div>

          <h2 className={styles.centerblock__h2}>Мои треки</h2>

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
                <p>
                  {redirecting
                    ? 'Перенаправление...'
                    : 'Проверка авторизации...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MainLayout pageTitle="Мои треки">
        <div className={styles.centerblock}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Перенаправление на страницу входа...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const centerBlockContent = (
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
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className={styles.clearSearchButton}
            type="button"
            title="Очистить поиск"
          >
            ×
          </button>
        )}
      </div>

      <h2 className={styles.centerblock__h2}> Мои треки</h2>

      <Filter
        tracks={favoriteTracks}
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
          {error ? (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={handleRetry} className={styles.retryButton}>
                Попробовать снова
              </button>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className={styles.empty}>
              {favoriteTracks.length === 0 ? (
                <>
                  <p>У вас пока нет избранных треков</p>
                  <p className={styles.mockInfo}>
                    Добавляйте треки в избранное, нажимая на иконку сердца
                  </p>
                </>
              ) : (
                <>
                  <p>Нет треков по выбранным фильтрам</p>
                  {(searchQuery ||
                    selectedArtists.length > 0 ||
                    selectedGenres.length > 0 ||
                    selectedYears.length > 0) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedArtists([]);
                        setSelectedGenres([]);
                        setSelectedYears([]);
                      }}
                      className={styles.retryButton}
                    >
                      Очистить фильтры
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            filteredTracks.map((track: Track, index: number) => (
              <div
                key={track._id || `track-${index}`}
                className={styles.trackItemWrapper}
              >
                <TrackItem
                  track={track}
                  index={index}
                  tracks={filteredTracks}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return <MainLayout pageTitle="Мои треки">{centerBlockContent}</MainLayout>;
}
