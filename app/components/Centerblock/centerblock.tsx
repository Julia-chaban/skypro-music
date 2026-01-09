'use client';

import React, { useEffect, useState } from 'react';
import Filter from '../Filter/Filter';
import Track from '../TrackItem/TrackItem';
import { Track as TrackType } from '@/types/track';
import { tracks as mockTracks } from '@/data/tracks';
import styles from './centerblock.module.css';

export default function Centerblock() {
  const [tracks, setTracks] = useState<TrackType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    const fetchTracks = () => {
      console.log('Starting to fetch tracks from API...');

      fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/catalog/track/all/',
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          cache: 'no-cache',
        },
      )
        .then((response) => {
          console.log(
            'API Response received. Status:',
            response.status,
            response.statusText,
          );

          if (!response.ok) {
            console.error('Response not OK. Status:', response.status);

            if (response.status === 404 || response.status === 500) {
              throw new Error(
                `API endpoint not found or server error: ${response.status}`,
              );
            }

            return response.text().then((text) => {
              console.log('Error response text:', text);
              throw new Error(
                `Server responded with ${response.status}: ${text}`,
              );
            });
          }

          const contentType = response.headers.get('content-type');
          console.log('Content-Type header:', contentType);

          if (contentType && contentType.includes('application/json')) {
            return response.json();
          } else {
            return response.text().then((text) => {
              console.log(
                'Non-JSON response received. First 200 chars:',
                text.substring(0, 200),
              );
              console.log('Full response length:', text.length);

              try {
                return JSON.parse(text);
              } catch (e) {
                console.error('Failed to parse as JSON:', e);
                throw new Error('API returned non-JSON response');
              }
            });
          }
        })
        .then((data) => {
          console.log('Data successfully parsed. Data type:', typeof data);
          console.log('Is array?', Array.isArray(data));

          let tracksArray: TrackType[] = [];

          if (Array.isArray(data)) {
            tracksArray = data;
            console.log(`Received ${data.length} tracks directly from API`);
          } else if (data && typeof data === 'object') {
            if (Array.isArray(data.tracks)) {
              tracksArray = data.tracks;
              console.log(
                `Received ${data.tracks.length} tracks from data.tracks`,
              );
            } else if (Array.isArray(data.data)) {
              tracksArray = data.data;
              console.log(`Received ${data.data.length} tracks from data.data`);
            } else if (Array.isArray(data.results)) {
              tracksArray = data.results;
              console.log(
                `Received ${data.results.length} tracks from data.results`,
              );
            } else if (Array.isArray(data.items)) {
              tracksArray = data.items;
              console.log(
                `Received ${data.items.length} tracks from data.items`,
              );
            } else {
              console.warn('Unexpected API response structure:', data);
              console.log('Object keys:', Object.keys(data));
            }
          }

          if (tracksArray.length > 0) {
            console.log(
              `Successfully loaded ${tracksArray.length} tracks from API`,
            );
            setTracks(tracksArray);
            setUseMockData(false);
          } else {
            console.warn(
              'API returned empty or invalid tracks array. Using mock data.',
            );
            throw new Error('API returned no valid tracks');
          }
        })
        .catch((apiError) => {
          console.error('API fetch failed:', apiError);
          console.log('Falling back to mock data...');

          setTracks(mockTracks);
          setUseMockData(true);
          setError('Используются демо-данные. API временно недоступно.');
        })
        .finally(() => {
          setLoading(false);
          console.log('Loading complete. Using mock data:', useMockData);
        });
    };

    fetchTracks();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setTracks([]);

    const fetchTracks = () => {
      fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/catalog/track/all/',
        {
          method: 'GET',
          mode: 'cors',
        },
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(blob);
          });
        })
        .then((text) => {
          console.log(
            'Response as text:',
            typeof text,
            'length:',
            (text as string).length,
          );

          try {
            const data = JSON.parse(text as string);
            if (Array.isArray(data)) {
              setTracks(data);
              setUseMockData(false);
              setError(null);
            } else {
              throw new Error('Response is not an array');
            }
          } catch (e) {
            console.error('Failed to parse response:', e);
            throw new Error('Invalid response format');
          }
        })
        .catch((error) => {
          console.error('Retry failed:', error);
          setTracks(mockTracks);
          setUseMockData(true);
          setError('Не удалось подключиться к API. Используются демо-данные.');
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchTracks();
  };

  if (loading) {
    return (
      <div className={styles.centerblock}>
        {/* Поиск с исправленной иконкой */}
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

        <h2 className={styles.centerblock__h2}>Треки</h2>

        <Filter tracks={tracks} />
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
            <div className={`${styles.playlistTitle__col} ${styles.col05}`}>
              ГОД
            </div>
            <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
              <svg className={styles.playlistTitle__svg}>
                <use xlinkHref="/icon/watch.svg"></use>
              </svg>
            </div>
          </div>
          <div className={styles.content__playlist}>
            <div className={styles.loading}>
              <div>Загрузка треков...</div>
              <div className={styles.loadingSpinner}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <h2 className={styles.centerblock__h2}>Треки</h2>
        <Filter tracks={tracks} />
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
            <div className={`${styles.playlistTitle__col} ${styles.col05}`}>
              ГОД
            </div>
            <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
              <svg className={styles.playlistTitle__svg}>
                <use xlinkHref="/icon/watch.svg"></use>
              </svg>
            </div>
          </div>
          <div className={styles.content__playlist}>
            <div className={styles.error}>
              <div>{error}</div>
              <button onClick={handleRetry} className={styles.retryButton}>
                Попробовать снова
              </button>
              {useMockData && (
                <div className={styles.mockInfo}>
                  Сейчас используются демонстрационные треки
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
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
          Треки {useMockData && '(демо)'}
        </h2>
        <Filter tracks={tracks} />
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
            <div className={`${styles.playlistTitle__col} ${styles.col05}`}>
              ГОД
            </div>
            <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
              <svg className={styles.playlistTitle__svg}>
                <use xlinkHref="/icon/watch.svg"></use>
              </svg>
            </div>
          </div>
          <div className={styles.content__playlist}>
            <div className={styles.error}>
              Треки не найдены
              <button onClick={handleRetry} className={styles.retryButton}>
                Обновить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centerblock}>
      {/* Поиск с исправленной иконкой */}
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
        Треки {useMockData && '(демо)'}
      </h2>
      <Filter tracks={tracks} />
      <div className={styles.centerblock__content}>
        {useMockData && (
          <div className={styles.mockWarning}>
            ⚠️ Используются демонстрационные данные
          </div>
        )}
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
          <div className={`${styles.playlistTitle__col} ${styles.col05}`}>
            ГОД
          </div>
          <div className={`${styles.playlistTitle__col} ${styles.col04}`}>
            <svg className={styles.playlistTitle__svg}>
              <use xlinkHref="/icon/watch.svg"></use>
            </svg>
          </div>
        </div>
        <div className={styles.content__playlist}>
          {tracks.map((track, index) => (
            <Track
              key={track._id}
              track={track}
              index={index}
              tracks={tracks}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
