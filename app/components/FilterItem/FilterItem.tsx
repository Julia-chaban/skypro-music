'use client';

import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import styles from './FilterItem.module.css';

interface FilterItemProps {
  label: string;
  filterType: 'artist' | 'year' | 'genre';
  isActive: boolean;
  onClick: () => void;
  popupContent?: React.ReactNode;
}

export default function FilterItem({
  label,
  isActive,
  onClick,
  popupContent,
}: FilterItemProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Закрытие попапа при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isActive &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        const button = document.querySelector(
          `.${styles.filter__button}.${styles.active}`,
        );
        if (!button?.contains(event.target as Node)) {
          onClick();
        }
      }
    };

    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActive, onClick]);

  return (
    <div className={styles.filterItemContainer}>
      <button
        className={classNames(styles.filter__button, styles.btnText, {
          [styles.active]: isActive,
        })}
        onClick={onClick}
        aria-expanded={isActive}
        aria-haspopup="true"
      >
        {label}
      </button>
      {isActive && popupContent && (
        <div
          className={styles.filter__popup}
          ref={popupRef}
          role="dialog"
          aria-label={`Фильтр по ${label}`}
        >
          {popupContent}
        </div>
      )}
    </div>
  );
}
