'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './sidebar.module.css';
import { useAuth } from '@/app/context/AuthContext';
import { Selection } from '@/types/track';

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

  const fetchSelections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://webdev-music-003b5b991590.herokuapp.com/catalog/selection/all/',
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Обработка ответа от API
      let selectionsData: Selection[] = [];

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
            selectionsData = arrayValues[0] as Selection[];
          }
        }
      }

      // Если нет данных, используем демо-подборки
      if (!selectionsData || selectionsData.length === 0) {
        throw new Error('Нет данных о подборках');
      }

      // Берем первые 3 подборки
      const limitedSelections = selectionsData.slice(0, 3);

      // Форматируем данные
      const formattedSelections = limitedSelections.map((selection: any) => ({
        _id: selection._id || selection.id || Math.random(),
        name: selection.name || selection.title || 'Подборка',
        author:
          selection.author ||
          selection.owner?.username ||
          selection.owner?.name ||
          'Музыкальный сервис',
        tracks: selection.tracks || selection.track_list || [],
        logo:
          selection.logo || selection.image || selection.cover_image || null,
      }));

      setSelections(formattedSelections);
      setError(null);
    } catch (error) {
      console.error('Error fetching selections:', error);
      setError('Не удалось загрузить подборки');
      // Используем демо-подборки
      setSelections([
        {
          _id: 1,
          name: 'Плейлист дня',
          author: 'Музыкальный сервис',
          tracks: [],
          logo: '/img/playlist01.png',
        },
        {
          _id: 2,
          name: '100 танцевальных хитов',
          author: 'Музыкальный сервис',
          tracks: [],
          logo: '/img/playlist02.png',
        },
        {
          _id: 3,
          name: 'Инди-заряд',
          author: 'Музыкальный сервис',
          tracks: [],
          logo: '/img/playlist03.png',
        },
      ]);
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
            </div>
          ) : error ? (
            <div className={styles.sidebar__error}>{error}</div>
          ) : (
            <div className={styles.sidebar__list}>
              {selections.map((selection) => (
                <div key={selection._id} className={styles.sidebar__item}>
                  <Link
                    className={styles.sidebar__link}
                    href={`/?collection=${selection._id}`}
                    onClick={() => setIsVisible(false)}
                  >
                    <img
                      className={styles.sidebar__img}
                      src={selection.logo || '/img/playlist-default.png'}
                      alt={selection.name}
                      width={250}
                      height={150}
                      onError={(e) => {
                        const defaultImages = [
                          '/img/playlist01.png',
                          '/img/playlist02.png',
                          '/img/playlist03.png',
                        ];
                        const index = selections.findIndex(
                          (s) => s._id === selection._id,
                        );
                        e.currentTarget.src =
                          defaultImages[index] || '/img/playlist-default.png';
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
