'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './navigation.module.css';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
      <div className={styles.nav__burger} onClick={toggleMenu}>
        <span className={styles.burger__line}></span>
        <span className={styles.burger__line}></span>
        <span className={styles.burger__line}></span>
      </div>
      <div className={`${styles.nav__menu} ${isMenuOpen ? styles.active : ''}`}>
        <ul className={styles.menu__list}>
          <li className={styles.menu__item}>
            <Link
              href="/"
              className={styles.menu__link}
              onClick={() => setIsMenuOpen(false)}
            >
              Главное
            </Link>
          </li>
          <li className={styles.menu__item}>
            <Link
              href="#"
              className={styles.menu__link}
              onClick={() => setIsMenuOpen(false)}
            >
              Мой плейлист
            </Link>
          </li>
          <li className={styles.menu__item}>
            <Link
              href="/auth/signin"
              className={styles.menu__link}
              onClick={() => setIsMenuOpen(false)}
            >
              Войти
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
