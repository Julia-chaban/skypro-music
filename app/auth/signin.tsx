'use client';

import React from 'react';
import Link from 'next/link';
import styles from './signin.module.css';

export default function Signin() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modal__block}>
          <form
            className={styles.modal__form}
            onSubmit={(e) => e.preventDefault()}
          >
            <Link href="/">
              <div className={styles.modal__logo}>
                <img src="/img/logo_modal.png" alt="logo" />
              </div>
            </Link>
            <input
              className={`${styles.modal__input} ${styles.login}`}
              type="email"
              name="email"
              placeholder="Почта"
              required
            />
            <input
              className={styles.modal__input}
              type="password"
              name="password"
              placeholder="Пароль"
              required
            />
            <div className={styles.errorContainer}>
              {/* Будет заполняться при ошибках */}
            </div>
            <button className={styles.modal__btnEnter} type="submit">
              Войти
            </button>
            <Link href="/auth/signup" className={styles.modal__btnSignup}>
              Зарегистрироваться
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
