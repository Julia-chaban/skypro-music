'use client';

import React from 'react';
import styles from './FilterPopupContent.module.css';

interface FilterPopupContentProps {
  title: string;
  items: string[];
  filterType: 'artist' | 'year' | 'genre';
  onItemClick?: (item: string) => void;
}

export default function FilterPopupContent({
  title,
  items,
  filterType,
  onItemClick,
}: FilterPopupContentProps) {
  const handleItemClick = (item: string) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <div className={styles.filter__popupContent}>
      <h3 className={styles.filter__popupTitle}>{title}</h3>
      <div className={styles.filter__list}>
        {items.map((item, index) => (
          <div
            key={`${filterType}-${index}`}
            className={styles.filter__item}
            onClick={() => handleItemClick(item)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
