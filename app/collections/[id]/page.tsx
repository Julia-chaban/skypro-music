// app/collections/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import '../../page.css';
import '../../page.mobile.css';
import Navigation from '../../components/Navigation/navigation';
import Sidebar from '../../components/Sidebar/sidebar';
import TrackItem from '../../components/TrackItem/TrackItem';
import { useState as useStateReact } from 'react';

interface Selection {
  _id: number;
  name: string;
  author: string;
  tracks: any[];
  logo: string | null;
}

export default function CollectionPage() {
  const params = useParams();
  const id = params.id as string;

  const [isSidebarOpen, setIsSidebarOpen] = useStateReact(false);
  const [collection, setCollection] = useState<Selection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBurgerClick = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://webdev-music-003b5b991590.herokuapp.com/catalog/selection/${id}/`,
      );

      if (!response.ok) {
        throw new Error('Не удалось загрузить подборку');
      }

      const data = await response.json();
      setCollection(data);
    } catch (error: any) {
      console.error('Error fetching collection:', error);
      setError('Не удалось загрузить подборку. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchCollection();
  };

  return (
    <div className="wrapper">
      <div className="container">
        <main className="main">
          <Navigation
            onBurgerClick={handleBurgerClick}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="centerblock">
            {loading ? (
              <div className="loading">
                <div className="loadingSpinner"></div>
                <p>Загрузка подборки...</p>
              </div>
            ) : error ? (
              <div className="error">
                <div>{error}</div>
                <button onClick={handleRetry} className="retryButton">
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
                    <p className="collectionAuthor">
                      Автор: {collection.author}
                    </p>
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
                      <div className="empty">
                        В этой подборке пока нет треков
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <Sidebar isOpen={isSidebarOpen} />
        </main>
        <footer className="footer"></footer>
      </div>
    </div>
  );
}
