// app/components/Navigation/navigation.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import styles from './navigation.module.css';

interface NavigationProps {
  onSidebarToggle?: (isOpen: boolean) => void;
}

export default function Navigation({ onSidebarToggle }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBurgerClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      const newState = !isDesktopMenuOpen;
      setIsDesktopMenuOpen(newState);

      if (onSidebarToggle) {
        onSidebarToggle(newState);
      }
    }
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsDesktopMenuOpen(false);

    if (onSidebarToggle) {
      onSidebarToggle(false);
    }
  };

  const handleLogout = () => {
    logout();
    closeAllMenus();
  };

  return (
    <nav className={styles.main__nav}>
      <div className={styles.nav__logo}>
        <Link href="/">
          <Image
            width={113}
            height={17}
            className={styles.logo__image}
            src="/img/logo.png"
            alt="logo"
            priority
          />
        </Link>
      </div>

      <div
        className={`${styles.nav__burger} ${isMobile ? (isMobileMenuOpen ? styles.active : '') : isDesktopMenuOpen ? styles.active : ''}`}
        onClick={handleBurgerClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleBurgerClick()}
      >
        <span className={styles.burger__line}></span>
        <span className={styles.burger__line}></span>
        <span className={styles.burger__line}></span>
      </div>

      {!isMobile && (
        <div
          className={`${styles.nav__menu} ${isDesktopMenuOpen ? styles.active : ''}`}
        >
          <ul className={styles.menu__list}>
            <li className={styles.menu__item}>
              <Link
                href="/"
                className={styles.menu__link}
                onClick={closeAllMenus}
              >
                Главное
              </Link>
            </li>
            {isAuthenticated && (
              <li className={styles.menu__item}>
                <Link
                  href="/favorites"
                  className={styles.menu__link}
                  onClick={closeAllMenus}
                >
                  Мои треки
                </Link>
              </li>
            )}
            <li className={styles.menu__item}>
              {isAuthenticated ? (
                <button
                  className={styles.menu__link}
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Выйти
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className={styles.menu__link}
                  onClick={closeAllMenus}
                >
                  Войти
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}

      {isMobile && (
        <div
          className={`${styles.nav__mobile_menu} ${isMobileMenuOpen ? styles.active : ''}`}
        >
          <ul className={styles.mobile_menu__list}>
            <li className={styles.mobile_menu__item}>
              <Link
                href="/"
                className={styles.mobile_menu__link}
                onClick={closeAllMenus}
              >
                Главное
              </Link>
            </li>
            {isAuthenticated && (
              <li className={styles.mobile_menu__item}>
                <Link
                  href="/favorites"
                  className={styles.mobile_menu__link}
                  onClick={closeAllMenus}
                >
                  Мои треки
                </Link>
              </li>
            )}
            <li className={styles.mobile_menu__item}>
              {isAuthenticated ? (
                <button
                  className={styles.mobile_menu__link}
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Выйти
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className={styles.mobile_menu__link}
                  onClick={closeAllMenus}
                >
                  Войти
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
