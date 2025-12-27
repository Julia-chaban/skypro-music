'use client';

import React from 'react';
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
  return (
    <div className={styles.filterItemContainer}>
      <button
        className={classNames(styles.filter__button, styles.btnText, {
          [styles.active]: isActive,
        })}
        onClick={onClick}
      >
        {label}
      </button>
      {isActive && popupContent && (
        <div className={styles.filter__popup}>{popupContent}</div>
      )}
    </div>
  );
}
