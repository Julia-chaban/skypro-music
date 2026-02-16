'use client';

import React, { useEffect, useRef } from 'react';
import styles from './FilterItem.module.css';

interface FilterItemProps {
  label: string;
  filterType: 'artist' | 'year' | 'genre';
  isActive: boolean;
  onClick: () => void;
  popupContent?: React.ReactNode;
  selectedCount?: number;
}

export default function FilterItem({
  label,
  isActive,
  onClick,
  popupContent,
  selectedCount = 0,
}: FilterItemProps) {
  const popupRef = useRef<HTMLDivElement>(null);

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

  const buttonClassNames = `${styles.filter__button} ${styles.btnText} ${
    isActive ? styles.active : ''
  } ${selectedCount > 0 ? styles.withSelection : ''}`;

  return (
    <div className={styles.filterItemContainer}>
      <button
        className={buttonClassNames}
        onClick={onClick}
        aria-expanded={isActive}
        aria-haspopup="true"
      >
        {label} {selectedCount > 0 && `(${selectedCount})`}
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
