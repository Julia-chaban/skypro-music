'use client';

import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleItemClick = (item: string) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Для мобильных добавляем класс compact если много элементов
  const listClassName =
    isMobile && items.length > 8
      ? `${styles.filter__list} ${styles['filter__list--compact']}`
      : styles.filter__list;

  return (
    <div className={styles.filter__popupContent}>
      <h3 className={styles.filter__popupTitle}>{title}</h3>
      <div className={listClassName}>
        {items.map((item, index) => {
          // Для длинных имён добавляем специальный класс
          const isLongName = item.length > 20;
          const itemClassName = isLongName
            ? `${styles.filter__item} ${styles['filter__item--long']}`
            : styles.filter__item;

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
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}
