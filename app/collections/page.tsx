'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '../components/MainLayout/MainLayout';
import { fetchApi } from '@/utils/api';
import { Selection, SelectionsListResponse } from '@/types/track';
import '../page.css';
import '../page.mobile.css';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchApi<SelectionsListResponse>(
          '/catalog/selection/all/',
        );

        let collectionsData: Selection[] = [];

        if (Array.isArray(data)) {
          collectionsData = data as Selection[];
        } else {
          if (data.selections && Array.isArray(data.selections)) {
            collectionsData = data.selections;
          } else if (data.data && Array.isArray(data.data)) {
            collectionsData = data.data;
          } else if (data.results && Array.isArray(data.results)) {
            collectionsData = data.results;
          } else if (data.items && Array.isArray(data.items)) {
            collectionsData = data.items;
          } else {
            collectionsData = Object.values(data).filter(
              (item): item is Selection =>
                item && typeof item === 'object' && '_id' in item,
            ) as Selection[];
          }
        }

        if (!Array.isArray(collectionsData)) {
          throw new Error('Неверный формат данных от сервера');
        }

        setCollections(collectionsData);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить подборки. Пожалуйста, попробуйте позже.';
        setError(errorMessage);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <MainLayout pageTitle="Подборки">
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
            <button
              onClick={() => window.location.reload()}
              className="retryButton"
            >
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
    </MainLayout>
  );
}
