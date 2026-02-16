'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './sidebar.module.css';
import { useAuth } from '@/app/context/AuthContext';
import { Selection, SelectionsListResponse } from '@/types/track';
import { fetchApi } from '@/utils/api';

interface ApiSelectionItem {
  _id?: number | string;
  id?: number | string;
  author?: string;
  owner?: string;
  tracks?: unknown[];
  items?: unknown[];
  logo?: string;
  image?: string;
  [key: string]: unknown;
}

interface SidebarProps {
  isOpen?: boolean;
}

const SELECTIONS_CONFIG = [
  { id: '2', name: 'Плейлист дня', defaultImage: '/img/playlist01.png' },
  {
    id: '3',
    name: '100 танцевальных хитов',
    defaultImage: '/img/playlist02.png',
  },
  { id: '4', name: 'Инди-заряд', defaultImage: '/img/playlist03.png' },
];

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

  const findSelectionInApiData = (
    data: SelectionsListResponse,
    targetId: string,
  ): ApiSelectionItem | null => {
    if (!data || typeof data !== 'object') return null;

    const allValues = Object.values(data);

    for (const value of allValues) {
      if (value && typeof value === 'object') {
        const foundItem = Object.values(value).find((item: unknown) => {
          if (!item || typeof item !== 'object') return false;

          const typedItem = item as ApiSelectionItem;
          const itemId = typedItem._id || typedItem.id;
          return String(itemId) === targetId;
        });

        if (foundItem) {
          return foundItem as ApiSelectionItem;
        }
      }
    }

    return null;
  };

  const fetchSelections = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchApi<SelectionsListResponse>(
        '/catalog/selection/all',
      );

      const formattedSelections: Selection[] = [];

      SELECTIONS_CONFIG.forEach((config) => {
        try {
          let selectionData: ApiSelectionItem | null = null;

          if (data && typeof data === 'object') {
            selectionData = findSelectionInApiData(data, config.id);
          }

          if (selectionData) {
            const author =
              selectionData.author ||
              selectionData.owner ||
              'Музыкальный сервис';
            const tracks = selectionData.tracks || selectionData.items || [];
            const logo =
              selectionData.logo || selectionData.image || config.defaultImage;

            formattedSelections.push({
              _id: config.id,
              name: config.name,
              author: String(author),
              tracks: Array.isArray(tracks) ? tracks : [],
              logo: String(logo),
            });
          } else {
            formattedSelections.push({
              _id: config.id,
              name: config.name,
              author: 'Музыкальный сервис',
              tracks: [],
              logo: config.defaultImage,
            });
          }
        } catch {
          formattedSelections.push({
            _id: config.id,
            name: config.name,
            author: 'Музыкальный сервис',
            tracks: [],
            logo: config.defaultImage,
          });
        }
      });

      setSelections(formattedSelections);
    } catch {
      const fallbackSelections = SELECTIONS_CONFIG.map((config) => ({
        _id: config.id,
        name: config.name,
        author: 'Музыкальный сервис',
        tracks: [],
        logo: config.defaultImage,
      }));

      setSelections(fallbackSelections);
      setError('Не удалось загрузить подборки. Используем стандартные.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = () => {
    setIsVisible(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSelectionClick = () => {
    if (isMobile) {
      setIsVisible(false);
    }
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
          <div
            className={styles.sidebar__icon}
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
            title="Выйти"
          >
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
          ) : (
            <div className={styles.sidebar__list}>
              {selections.map((selection) => (
                <div key={selection._id} className={styles.sidebar__item}>
                  <Link
                    className={styles.sidebar__link}
                    href={`/?collection=${selection._id}`}
                    onClick={handleSelectionClick}
                  >
                    <div className={styles.sidebar__imageContainer}>
                      <img
                        className={styles.sidebar__img}
                        src={selection.logo}
                        alt={selection.name}
                        width={250}
                        height={150}
                        onError={(e) => {
                          const configIndex = SELECTIONS_CONFIG.findIndex(
                            (config) => config.id === selection._id,
                          );
                          if (configIndex !== -1) {
                            e.currentTarget.src =
                              SELECTIONS_CONFIG[configIndex].defaultImage;
                          } else {
                            e.currentTarget.src = '/img/playlist01.png';
                          }
                        }}
                      />
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
