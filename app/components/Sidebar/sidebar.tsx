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

  // Конфигурация подборок с правильными ID и названиями
  const SELECTIONS_CONFIG = [
    { id: '2', name: 'Плейлист дня', defaultImage: '/img/playlist01.png' },
    {
      id: '3',
      name: '100 танцевальных хитов',
      defaultImage: '/img/playlist02.png',
    },
    { id: '4', name: 'Инди-заряд', defaultImage: '/img/playlist03.png' },
  ];

  const fetchSelections = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Загружаем подборки...');
      const data = await fetchApi<SelectionsListResponse>(
        '/catalog/selection/all',
      );
      console.log('📦 Selections API response:', data);

      // Создаем массив для подборок
      const formattedSelections: Selection[] = [];

      // Проходим по конфигурации и ищем подборки по ID
      SELECTIONS_CONFIG.forEach((config, index) => {
        try {
          let selectionData = null;

          // Ищем подборку в данных API
          if (data && typeof data === 'object') {
            // Если это объект с вложенными объектами (как на скриншоте)
            const allValues = Object.values(data);

            for (const value of allValues) {
              if (value && typeof value === 'object') {
                // Ищем объект с нужным ID
                const foundItem = Object.values(value).find((item: any) => {
                  if (!item || typeof item !== 'object') return false;

                  const itemId = item._id || item.id;
                  return String(itemId) === config.id;
                });

                if (foundItem) {
                  selectionData = foundItem;
                  break;
                }
              }
            }
          }

          // Если нашли подборку, используем ее данные
          if (selectionData) {
            console.log(`✅ Найдена подборка ${config.id}:`, selectionData);

            const author =
              selectionData.author ||
              selectionData.owner ||
              'Музыкальный сервис';
            const tracks = selectionData.tracks || selectionData.items || [];
            const logo =
              selectionData.logo || selectionData.image || config.defaultImage;

            formattedSelections.push({
              _id: config.id,
              name: config.name, // Используем правильное название из конфигурации
              author: String(author),
              tracks: Array.isArray(tracks) ? tracks : [],
              logo: String(logo),
            });
          } else {
            // Если не нашли в API, создаем заглушку
            console.log(
              `⚠️ Подборка ${config.id} не найдена в API, создаем заглушку`,
            );
            formattedSelections.push({
              _id: config.id,
              name: config.name,
              author: 'Музыкальный сервис',
              tracks: [],
              logo: config.defaultImage,
            });
          }
        } catch (error) {
          console.warn(`⚠️ Ошибка при обработке подборки ${config.id}:`, error);
          // Создаем заглушку в случае ошибки
          formattedSelections.push({
            _id: config.id,
            name: config.name,
            author: 'Музыкальный сервис',
            tracks: [],
            logo: config.defaultImage,
          });
        }
      });

      console.log('🎯 Formatted selections:', formattedSelections);
      setSelections(formattedSelections);
    } catch (error: any) {
      console.error('❌ Error fetching selections:', error);

      // Создаем заглушки при ошибке загрузки API
      const fallbackSelections = SELECTIONS_CONFIG.map((config, index) => ({
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

  const handleSelectionClick = (selection: Selection) => {
    console.log('🎯 Клик по подборке в сайдбаре:', {
      id: selection._id,
      name: selection.name,
      tracksCount: selection.tracks?.length || 0,
    });
    // Закрываем меню на мобильных устройствах
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
          ) : (
            <div className={styles.sidebar__list}>
              {selections.map((selection) => (
                <div key={selection._id} className={styles.sidebar__item}>
                  <Link
                    className={styles.sidebar__link}
                    href={`/?collection=${selection._id}`}
                    onClick={() => handleSelectionClick(selection)}
                  >
                    <div className={styles.sidebar__imageContainer}>
                      <img
                        className={styles.sidebar__img}
                        src={selection.logo}
                        alt={selection.name}
                        width={250}
                        height={150}
                        onError={(e) => {
                          // При ошибке загрузки изображения используем дефолтное
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
                      <div className={styles.selection__overlay}>
                        <span className={styles.selection__name}>
                          {selection.name}
                        </span>
                        <span className={styles.selection__author}>
                          {selection.author}
                        </span>
                      </div>
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
