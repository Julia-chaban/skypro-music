'use client';

import React from 'react';
import Link from 'next/link';
import styles from './signup.module.css';

export default function SignUp() {
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
            <input
              className={styles.modal__input}
              type="password"
              name="confirmPassword"
              placeholder="Повторите пароль"
              required
            />
            <div className={styles.errorContainer}></div>
            <button className={styles.modal__btnSignupEnt} type="submit">
              Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
