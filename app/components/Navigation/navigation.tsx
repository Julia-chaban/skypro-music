'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './navigation.module.css';

interface NavigationProps {
  onSidebarToggle?: (isOpen: boolean) => void;
}

export default function Navigation({ onSidebarToggle }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false); // Закрываем мобильное меню на десктопе
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleBurgerClick = () => {
    if (isMobile) {
      // На мобильных: открываем/закрываем мобильное меню
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      // На десктопе: открываем/закрываем меню под бургером и Sidebar
      const newState = !isDesktopMenuOpen;
      setIsDesktopMenuOpen(newState);

      // Управляем Sidebar
      if (onSidebarToggle) {
        onSidebarToggle(newState);
      }
    }
  };

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsDesktopMenuOpen(false);

    // Закрываем Sidebar при клике на пункт меню
    if (onSidebarToggle) {
      onSidebarToggle(false);
    }
  };

  return (
    <nav className={styles.main__nav}>
      {/* На десктопе: логотип СВЕРХУ, под ним бургер */}
      {!isMobile && (
        <>
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

          {/* Бургер под логотипом на десктопе */}
          <div
            className={`${styles.nav__burger} ${isDesktopMenuOpen ? styles.active : ''}`}
            onClick={handleBurgerClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleBurgerClick()}
          >
            <span className={styles.burger__line}></span>
            <span className={styles.burger__line}></span>
            <span className={styles.burger__line}></span>
          </div>
        </>
      )}

      {/* На мобильных: логотип и бургер в строке */}
      {isMobile && (
        <>
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

          {/* Бургер справа на мобильных */}
          <div
            className={`${styles.nav__burger} ${isMobileMenuOpen ? styles.active : ''}`}
            onClick={handleBurgerClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleBurgerClick()}
          >
            <span className={styles.burger__line}></span>
            <span className={styles.burger__line}></span>
            <span className={styles.burger__line}></span>
          </div>
        </>
      )}

      {/* Десктопное меню (открывается при клике на бургер под лого) */}
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
            <li className={styles.menu__item}>
              <Link
                href="#"
                className={styles.menu__link}
                onClick={closeAllMenus}
              >
                Мой плейлист
              </Link>
            </li>
            <li className={styles.menu__item}>
              <Link
                href="/auth/signin"
                className={styles.menu__link}
                onClick={closeAllMenus}
              >
                Войти
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Мобильное меню (открывается при клике на бургер справа) */}
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
            <li className={styles.mobile_menu__item}>
              <Link
                href="#"
                className={styles.mobile_menu__link}
                onClick={closeAllMenus}
              >
                Мой плейлист
              </Link>
            </li>
            <li className={styles.mobile_menu__item}>
              <Link
                href="/auth/signin"
                className={styles.mobile_menu__link}
                onClick={closeAllMenus}
              >
                Войти
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
