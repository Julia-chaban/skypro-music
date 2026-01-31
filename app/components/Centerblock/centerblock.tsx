'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import Filter from '../Filter/Filter';
import Track from '../TrackItem/TrackItem';
import {
  Track as TrackType,
  SelectionResponse,
  TracksListResponse,
} from '@/types/track';
import { setFilteredPlaylist, setPlaylist } from '@/store/features/trackSlice';
import { fetchApi } from '@/utils/api';
import styles from './centerblock.module.css';

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

  useEffect(() => {
    console.log('🎯 collectionId изменился:', collectionId);
  }, [collectionId]);

  const fetchAllTracks = async (): Promise<TrackType[]> => {
    try {
      console.log('🔄 Загружаем ВСЕ треки из API');

      const data = await fetchApi<TracksListResponse>('/catalog/track/all/');
      console.log('📦 Ответ API (все треки):', data);

      let tracksArray: TrackType[] = [];

      if (Array.isArray(data)) {
        tracksArray = data;
        console.log('📊 API вернул массив напрямую');
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) {
          tracksArray = data.data;
          console.log('📊 Нашли треки в поле data');
        } else if (Array.isArray(data.tracks)) {
          tracksArray = data.tracks;
          console.log('📊 Нашли треки в поле tracks');
        } else if (Array.isArray(data.results)) {
          tracksArray = data.results;
          console.log('📊 Нашли треки в поле results');
        } else if (Array.isArray(data.items)) {
          tracksArray = data.items;
          console.log('📊 Нашли треки в поле items');
        } else {
          const arrayValues = Object.values(data).filter(Array.isArray);
          if (arrayValues.length > 0) {
            tracksArray = arrayValues[0] as TrackType[];
            console.log('📊 Нашли треки в произвольном поле массива');
          }
        }
      }

      console.log('✅ Извлечено треков:', tracksArray.length);

      if (tracksArray.length === 0) {
        console.warn('⚠️ API вернул пустой массив треков');
      }

      return tracksArray;
    } catch (error) {
      console.error('❌ Ошибка при загрузке всех треков:', error);
      throw error;
    }
  };

  const fetchCollectionById = async (
    id: string,
  ): Promise<{ title: string; tracks: TrackType[] }> => {
    try {
      console.log(`🎯 Загружаем подборку с ID: ${id}`);

      // ИСПРАВЛЕНИЕ НАЧИНАЕТСЯ ЗДЕСЬ
      // Получаем все подборки
      const data = await fetchApi<any>('/catalog/selection/all/');
      console.log('📦 Все подборки:', data);

      let title = 'Подборка';

      // Определяем правильные названия для подборок
      const selectionNames: Record<string, string> = {
        '2': 'Плейлист дня',
        '3': '100 танцевальных хитов',
        '4': 'Инди-заряд',
      };

      // Устанавливаем название из конфигурации
      if (selectionNames[id]) {
        title = selectionNames[id];
        console.log(`🏷️ Название подборки: "${title}"`);
      }

      let trackIds: number[] = [];

      // Ищем подборку в структуре данных (как на скриншоте: 14: {_id: 2, name:"Плейлист дня", items: [35,34,12,...]})
      if (data && typeof data === 'object') {
        const targetIdNum = parseInt(id);
        let foundSelection = null;

        // Ищем во всей структуре данных
        const searchInObject = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null;

          // Проверяем текущий объект
          if (obj._id === targetIdNum || obj.id === targetIdNum) {
            return obj;
          }

          // Ищем во вложенных объектах
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              const found = searchInObject(obj[key]);
              if (found) return found;
            }
          }

          return null;
        };

        foundSelection = searchInObject(data);

        if (foundSelection) {
          console.log('✅ Найдена подборка:', foundSelection);

          // Получаем ID треков из поля items
          if (foundSelection.items && Array.isArray(foundSelection.items)) {
            trackIds = foundSelection.items.map((itemId: any) =>
              Number(itemId),
            );
            console.log('🎵 ID треков в подборке:', trackIds);
          }
        }
      }

      // Получаем треки по ID
      let tracksArray: TrackType[] = [];
      if (trackIds.length > 0) {
        // Загружаем все треки и фильтруем по ID
        const allTracks = await fetchAllTracks();
        tracksArray = allTracks.filter((track) => {
          const trackId =
            typeof track._id === 'number' ? track._id : parseInt(track._id);
          return trackIds.includes(trackId);
        });
        console.log(`✅ Найдено треков для подборки: ${tracksArray.length}`);
      }
      // ИСПРАВЛЕНИЕ ЗАКАНЧИВАЕТСЯ ЗДЕСЬ

      console.log(`🎵 Треков в подборке: ${tracksArray.length}`);

      return { title, tracks: tracksArray };
    } catch (error) {
      console.error(`❌ Ошибка загрузки подборки ${id}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchTracks = async (): Promise<void> => {
      try {
        console.log('🔥 ========= НАЧАЛО ЗАГРУЗКИ =========');
        console.log('📌 Collection ID:', collectionId);

        setLoading(true);
        setError(null);
        setSelectedArtists([]);
        setSelectedGenres([]);
        setSelectedYears([]);

        let tracksArray: TrackType[] = [];
        let title = collectionId ? 'Загрузка подборки...' : 'Треки';

        if (collectionId) {
          console.log(`🎯 Режим: Загружаем подборку`);

          try {
            const collectionData = await fetchCollectionById(collectionId);
            title = collectionData.title;
            tracksArray = collectionData.tracks;

            console.log(`✅ Подборка "${title}" загружена`);
            console.log(`✅ Треков в подборке: ${tracksArray.length}`);

            if (tracksArray.length === 0) {
              console.log('ℹ️ Подборка пустая');
            }
          } catch (apiError: any) {
            console.error('❌ Ошибка загрузки подборки:', apiError);

            const errorMessage = apiError.message || 'Неизвестная ошибка';
            setError(`Не удалось загрузить подборку: ${errorMessage}`);
            tracksArray = [];
            title = 'Подборка';
          }
        } else {
          console.log('🏠 Режим: Главная страница (все треки)');
          tracksArray = await fetchAllTracks();
          title = 'Треки';
          console.log(`✅ Всего треков: ${tracksArray.length}`);
        }

        console.log('🎯 ========= ФИНАЛЬНЫЕ ДАННЫЕ =========');
        console.log(`🏷️ Заголовок: "${title}"`);
        console.log(`🎵 Треков: ${tracksArray.length}`);

        setTracks(tracksArray);
        setCollectionTitle(title);
      } catch (error: any) {
        console.error('💥 Критическая ошибка:', error);
        setError(`Произошла ошибка: ${error.message || 'Неизвестная ошибка'}`);
        setTracks([]);
        setCollectionTitle(collectionId ? 'Подборка' : 'Треки');
      } finally {
        console.log('✅ ========= ЗАГРУЗКА ЗАВЕРШЕНА =========');
        setLoading(false);
      }
    };

    fetchTracks();
  }, [collectionId]);

  const filteredTracks = useMemo(() => {
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
  }, [tracks, selectedArtists, selectedGenres, selectedYears]);

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
                {collectionId
                  ? 'В этой подборке пока нет треков'
                  : 'Треков не найдено'}
              </p>
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
