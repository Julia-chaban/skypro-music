'use client';

import React, { useState, useEffect } from 'react';
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
  selectedItems = [],
  onItemToggle,
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
    if (onItemToggle) {
      onItemToggle(item);
    }
  };

  const displayItems = isMobile ? items.slice(0, 20) : items;
  const hasMoreItems = items.length > displayItems.length;

  return (
    <div className={styles.filter__popupContent}>
      <h3 className={styles.filter__popupTitle}>{title}</h3>
      <div className={styles.filter__list}>
        {displayItems.map((item, index) => {
          const isSelected = selectedItems.includes(item);
          const isLongName = item.length > 20;
          const itemClassName = isLongName
            ? `${styles.filter__item} ${styles['filter__item--long']} ${isSelected ? styles.active : ''}`
            : `${styles.filter__item} ${isSelected ? styles.active : ''}`;

          return (
            <div
              key={`${title}-${index}`}
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
        {hasMoreItems && (
          <div className={styles.moreItemsIndicator}>
            ...и еще {items.length - displayItems.length}
          </div>
        )}
      </div>
    </div>
  );
}
