'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './signup.module.css';
import { useAuth } from '@/app/context/AuthContext';

export default function SignUp() {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.email.trim()) {
      newErrors.push('Введите email адрес');
    } else if (!formData.email.includes('@')) {
      newErrors.push('Введите корректный email адрес');
    }

    if (!formData.username.trim()) {
      newErrors.push('Введите имя пользователя');
    }

    if (!formData.password.trim()) {
      newErrors.push('Введите пароль');
    } else if (formData.password.length < 6) {
      newErrors.push('Пароль должен содержать минимум 6 символов');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Пароли не совпадают');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrors([]);

    try {
      await signup(formData.email, formData.password, formData.username);
      router.push('/auth/signin');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при регистрации';
      setErrors([errorMessage]);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modal__block}>
          <form className={styles.modal__form} onSubmit={handleSubmit}>
            <Link href="/">
              <div className={styles.modal__logo}>
                <img src="/img/logo_modal.png" alt="logo" />
              </div>
            </Link>

            <input
              className={styles.modal__input}
              type="text"
              name="username"
              placeholder="Имя пользователя"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />

            <input
              className={`${styles.modal__input} ${styles.login}`}
              type="email"
              name="email"
              placeholder="Почта"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />

            <input
              className={styles.modal__input}
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />

            <input
              className={styles.modal__input}
              type="password"
              name="confirmPassword"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />

            <div className={styles.errorContainer}>
              {errors.map((error, index) => (
                <div key={index} className={styles.error}>
                  {error}
                </div>
              ))}
            </div>

            <button
              className={styles.modal__btnSignupEnt}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>

            <Link href="/auth/signin" className={styles.modal__btnSignup}>
              Уже есть аккаунт? Войти
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
