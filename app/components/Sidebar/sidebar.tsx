'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = true }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);

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
      setIsVisible(true); // На десктопе всегда открыт
    }
  }, [isOpen, isMobile]);

  const handleOverlayClick = () => {
    setIsVisible(false);
  };

  return (
    <>
      {/* Затемнение фона на мобильных */}
      {isMobile && (
        <div
          className={`${styles.sidebar__overlay} ${isVisible ? styles.active : ''}`}
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${styles.main__sidebar} ${isVisible ? styles.open : ''}`}
      >
        <div className={styles.sidebar__personal}>
          <p className={styles.sidebar__personalName}>Sergey.Ivanov</p>
          <div className={styles.sidebar__icon}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <use xlinkHref="/icon/logout.svg"></use>
            </svg>
          </div>
        </div>
        <div className={styles.sidebar__block}>
          <div className={styles.sidebar__list}>
            <div className={styles.sidebar__item}>
              <Link className={styles.sidebar__link} href="#">
                <Image
                  className={styles.sidebar__img}
                  src="/img/playlist01.png"
                  alt="Плейлист дня"
                  width={250}
                  height={150}
                  priority
                />
              </Link>
            </div>
            <div className={styles.sidebar__item}>
              <Link className={styles.sidebar__link} href="#">
                <Image
                  className={styles.sidebar__img}
                  src="/img/playlist02.png"
                  alt="Плейлист дня"
                  width={250}
                  height={150}
                />
              </Link>
            </div>
            <div className={styles.sidebar__item}>
              <Link className={styles.sidebar__link} href="#">
                <Image
                  className={styles.sidebar__img}
                  src="/img/playlist03.png"
                  alt="Плейлист дня"
                  width={250}
                  height={150}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
