'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './FilterPopupContent.module.css';

interface FilterPopupContentProps {
  title: string;
  items: string[];
  filterType: 'artist' | 'year' | 'genre';
  selectedItems?: string[];
  onItemToggle?: (item: string) => void;
}

export default function FilterPopupContent({
  title,
  items,
  filterType,
  selectedItems = [],
  onItemToggle,
}: FilterPopupContentProps) {
  const [isMobile, setIsMobile] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleItemClick = (item: string) => {
    if (onItemToggle) {
      onItemToggle(item);
    }
  };

  const listClassName = isMobile
    ? `${styles.filter__list}`
    : styles.filter__list;

  return (
    <div className={styles.filter__popupContent}>
      <h3 className={styles.filter__popupTitle}>{title}</h3>
      <div className={listClassName} ref={listRef}>
        {items.map((item, index) => {
          const isSelected = selectedItems.includes(item);
          const isLongName = item.length > 20;
          const itemClassName = isLongName
            ? `${styles.filter__item} ${styles['filter__item--long']} ${isSelected ? styles.active : ''}`
            : `${styles.filter__item} ${isSelected ? styles.active : ''}`;

          return (
            <div
              key={`${filterType}-${index}`}
              className={itemClassName}
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
              title={item}
            >
              {item} {isSelected && '✓'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
