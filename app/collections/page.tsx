'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import '../page.css';
import '../page.mobile.css';
import Navigation from '../components/Navigation/navigation';
import Sidebar from '../components/Sidebar/sidebar';
import Bar from '../components/Bar/bar';
import { useState as useStateReact } from 'react';

interface Selection {
  _id: number;
  name: string;
  author: string;
  logo: string | null;
  tracks: any[];
}

export default function CollectionsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useStateReact(false);
  const [collections, setCollections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBurgerClick = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/catalog/selection/all/',
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // ИСПРАВЛЕНИЕ: Проверяем и обрабатываем разные форматы ответа
      let collectionsData: Selection[] = [];

      if (Array.isArray(data)) {
        // Если API возвращает массив напрямую
        collectionsData = data;
      } else if (data && typeof data === 'object') {
        // Если API возвращает объект с массивом внутри
        if (Array.isArray(data.selections)) {
          collectionsData = data.selections;
        } else if (Array.isArray(data.data)) {
          collectionsData = data.data;
        } else if (Array.isArray(data.results)) {
          collectionsData = data.results;
        } else if (Array.isArray(data.items)) {
          collectionsData = data.items;
        } else {
          // Логируем структуру ответа для отладки
          console.log('Collections API response structure:', Object.keys(data));
          // Если не нашли массив, пробуем преобразовать объект
          collectionsData = Object.values(data).filter(
            (item) => item && typeof item === 'object' && '_id' in item,
          ) as Selection[];
        }
      }

      // Проверяем, что у нас есть массив
      if (!Array.isArray(collectionsData)) {
        console.error('Invalid data format from API:', data);
        throw new Error('Неверный формат данных от сервера');
      }

      setCollections(collectionsData);
    } catch (error: any) {
      console.error('Error fetching collections:', error);
      setError('Не удалось загрузить подборки. Пожалуйста, попробуйте позже.');
      // Устанавливаем пустой массив при ошибке
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchCollections();
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
            <h2 className="centerblock__h2">Подборки</h2>

            {loading ? (
              <div className="loading">
                <div className="loadingSpinner"></div>
                <p>Загрузка подборок...</p>
              </div>
            ) : error ? (
              <div className="error">
                <div>{error}</div>
                <button onClick={handleRetry} className="retryButton">
                  Попробовать снова
                </button>
              </div>
            ) : collections.length === 0 ? (
              <div className="empty">
                <p>Подборок пока нет</p>
              </div>
            ) : (
              <div className="collectionsGrid">
                {collections.map((collection) => (
                  <Link
                    key={collection._id}
                    href={`/collections/${collection._id}`}
                    className="collectionCard"
                  >
                    <div className="collectionImage">
                      {collection.logo ? (
                        <img src={collection.logo} alt={collection.name} />
                      ) : (
                        <div className="defaultImage">
                          <svg className="cardIcon">
                            <use xlinkHref="/icon/collection.svg"></use>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="collectionInfo">
                      <h3 className="collectionName">{collection.name}</h3>
                      <p className="collectionAuthor">{collection.author}</p>
                      <p className="collectionTracks">
                        {collection.tracks?.length || 0} треков
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Sidebar isOpen={isSidebarOpen} />
        </main>
        <footer className="footer"></footer>
      </div>
      {/* Bar добавлен вне .container */}
      <Bar />
    </div>
  );
}
