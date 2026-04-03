'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './sidebar.module.css';
import { useAuth } from '@/app/context/AuthContext';
import { Selection, SelectionsListResponse } from '@/types/track';
import { fetchApi } from '@/utils/api';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsVisible(isOpen);
    } else {
      setIsVisible(true);
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    fetchSelections();
  }, []);

  const fetchSelections = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchApi<SelectionsListResponse>(
        '/catalog/selection/all',
      );
      console.log('📦 Selections API response:', data);

      let selectionsData: any[] = [];

      if (Array.isArray(data)) {
        selectionsData = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.selections)) {
          selectionsData = data.selections;
        } else if (Array.isArray(data.data)) {
          selectionsData = data.data;
        } else if (Array.isArray(data.results)) {
          selectionsData = data.results;
        } else if (Array.isArray(data.items)) {
          selectionsData = data.items;
        } else {
          const arrayValues = Object.values(data).filter(Array.isArray);
          if (arrayValues.length > 0) {
            selectionsData = arrayValues[0];
          }
        }
      }

      console.log('✅ Raw selections data:', selectionsData);

      if (selectionsData && selectionsData.length > 0) {
        const uniqueSelections = selectionsData
          .slice(0, 3)
          .map((item, index) => {
            const id = item._id || item.id || `selection-${index + 1}`;
            const name = item.name || item.title || `Подборка ${index + 1}`;
            const author = item.author || 'Музыкальный сервис';
            const tracks = item.tracks || [];
            const logo = item.logo || getDefaultImage(index);

            return {
              _id: String(id),
              name,
              author,
              tracks,
              logo,
            } as Selection;
          });

        console.log('🎯 Formatted selections (первые 3):', uniqueSelections);
        setSelections(uniqueSelections);
      } else {
        console.log('ℹ️ API вернул пустой список подборок');
        setSelections([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching selections:', error);
      setError('Не удалось загрузить подборки');
      setSelections([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultImage = (index: number): string => {
    const defaultImages = [
      '/img/playlist01.png',
      '/img/playlist02.png',
      '/img/playlist03.png',
    ];
    return defaultImages[index] || '/img/playlist01.png';
  };

  const handleOverlayClick = () => {
    setIsVisible(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSelectionClick = (selection: Selection) => {
    console.log('🎯 Клик по подборке в сайдбаре:', {
      id: selection._id,
      name: selection.name,
      tracksCount: selection.tracks?.length || 0,
    });
    setIsVisible(false);
  };

  return (
    <>
      {isMobile && (
        <div
          className={`${styles.sidebar__overlay} ${isVisible ? styles.active : ''}`}
          onClick={handleOverlayClick}
        />
      )}

      <div
        className={`${styles.main__sidebar} ${isVisible ? styles.open : ''}`}
      >
        <div className={styles.sidebar__personal}>
          <p className={styles.sidebar__personalName}>
            {user ? user.username : 'Гость'}
          </p>
          <div className={styles.sidebar__icon} onClick={handleLogout}>
            <svg>
              <use xlinkHref="/icon/logout.svg"></use>
            </svg>
          </div>
        </div>
        <div className={styles.sidebar__block}>
          {loading ? (
            <div className={styles.sidebar__loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Загрузка подборок...</p>
            </div>
          ) : error ? (
            <div className={styles.sidebar__error}>
              <p>{error}</p>
              <button
                onClick={() => fetchSelections()}
                className={styles.retryButton}
              >
                Повторить
              </button>
            </div>
          ) : selections.length === 0 ? (
            <div className={styles.sidebar__empty}>
              <p>Подборок пока нет</p>
              <button
                onClick={() => fetchSelections()}
                className={styles.retryButton}
              >
                Обновить
              </button>
            </div>
          ) : (
            <div className={styles.sidebar__list}>
              {selections.map((selection) => (
                <div key={selection._id} className={styles.sidebar__item}>
                  <Link
                    className={styles.sidebar__link}
                    href={`/?collection=${selection._id}`}
                    onClick={() => handleSelectionClick(selection)}
                  >
                    <img
                      className={styles.sidebar__img}
                      src={selection.logo}
                      alt={selection.name}
                      width={250}
                      height={150}
                      onError={(e) => {
                        const index = selections.findIndex(
                          (s) => s._id === selection._id,
                        );
                        e.currentTarget.src = getDefaultImage(index);
                      }}
                    />
                    <div className={styles.selection__overlay}>
                      <span className={styles.selection__name}>
                        {selection.name}
                      </span>
                      <span className={styles.selection__author}>
                        {selection.author}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
