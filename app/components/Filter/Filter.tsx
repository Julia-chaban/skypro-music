'use client';

import React, { useState } from 'react';
import FilterItem from '../FilterItem/FilterItem';
import FilterPopupContent from '../FilterPopupContent/FilterPopupContent';
import {
  getUniqueArtists,
  getUniqueYears,
  getUniqueGenres,
} from '@/data/tracks';
import styles from './Filter.module.css';

type FilterType = 'artist' | 'year' | 'genre' | null;

export default function Filter() {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const uniqueArtists = getUniqueArtists();
  const uniqueYears = getUniqueYears();
  const uniqueGenres = getUniqueGenres();

  const handleFilterClick = (filterType: FilterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  return (
    <div className={styles.centerblock__filter}>
      <div className={styles.filter__title}>Искать по:</div>
      <FilterItem
        label="исполнителю"
        filterType="artist"
        isActive={activeFilter === 'artist'}
        onClick={() => handleFilterClick('artist')}
        popupContent={
          activeFilter === 'artist' && (
            <FilterPopupContent
              title="Исполнитель"
              items={uniqueArtists}
              filterType="artist"
            />
          )
        }
      />
      <FilterItem
        label="году выпуска"
        filterType="year"
        isActive={activeFilter === 'year'}
        onClick={() => handleFilterClick('year')}
        popupContent={
          activeFilter === 'year' && (
            <FilterPopupContent
              title="Год выпуска"
              items={uniqueYears}
              filterType="year"
            />
          )
        }
      />
      <FilterItem
        label="жанру"
        filterType="genre"
        isActive={activeFilter === 'genre'}
        onClick={() => handleFilterClick('genre')}
        popupContent={
          activeFilter === 'genre' && (
            <FilterPopupContent
              title="Жанр"
              items={uniqueGenres}
              filterType="genre"
            />
          )
        }
      />
    </div>
  );
}
