// app/collections/[id]/page.tsx (детали подборки)
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MainLayout from '../../components/MainLayout/MainLayout';
import TrackItem from '../../components/TrackItem/TrackItem';
import { fetchApi } from '@/services/api';
import { SelectionResponse } from '@/types/track';
import '../../page.css';
import '../../page.mobile.css';

export default function CollectionPage() {
  const params = useParams();
  const id = params.id as string;

  const [collection, setCollection] = useState<SelectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // ✅ ИСПОЛЬЗУЕМ API СЕРВИС
        const data = await fetchApi<SelectionResponse>(
          `/catalog/selection/${id}/`,
        );
        setCollection(data);
      } catch (error: any) {
        console.error('Error fetching collection:', error);
        setError(
          error.message ||
            'Не удалось загрузить подборку. Пожалуйста, попробуйте позже.',
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCollection();
    }
  }, [id]);

  return (
    <MainLayout pageTitle={collection?.name || 'Подборка'}>
      <div className="centerblock">
        {loading ? (
          <div className="loading">
            <div className="loadingSpinner"></div>
            <p>Загрузка подборки...</p>
          </div>
        ) : error ? (
          <div className="error">
            <div>{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="retryButton"
            >
              Попробовать снова
            </button>
          </div>
        ) : !collection ? (
          <div className="error">
            <div>Подборка не найдена</div>
          </div>
        ) : (
          <>
            <div className="collectionHeader">
              <div className="collectionLogo">
                {collection.logo ? (
                  <img src={collection.logo} alt={collection.name} />
                ) : (
                  <div className="defaultLogo">
                    <svg className="logoIcon">
                      <use xlinkHref="/icon/collection.svg"></use>
                    </svg>
                  </div>
                )}
              </div>
              <div className="collectionInfo">
                <h1 className="collectionTitle">{collection.name}</h1>
                <p className="collectionAuthor">Автор: {collection.author}</p>
                <p className="collectionTracksCount">
                  Треков: {collection.tracks?.length || 0}
                </p>
              </div>
            </div>

            <div className="centerblock__content">
              <div className="content__title">
                <div className="playlistTitle__col col01">Трек</div>
                <div className="playlistTitle__col col02">Исполнитель</div>
                <div className="playlistTitle__col col03">Альбом</div>
                <div className="playlistTitle__col col04">
                  <svg className="playlistTitle__svg">
                    <use xlinkHref="/icon/watch.svg"></use>
                  </svg>
                </div>
              </div>

              <div className="content__playlist">
                {collection.tracks && collection.tracks.length > 0 ? (
                  collection.tracks.map((track, index) => (
                    <TrackItem
                      key={track._id}
                      track={track}
                      index={index}
                      tracks={collection.tracks}
                    />
                  ))
                ) : (
                  <div className="empty">В этой подборке пока нет треков</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
