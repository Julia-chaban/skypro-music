'use client';

import React, { useState } from 'react';
import FilterItem from '../FilterItem/FilterItem';
import FilterPopupContent from '../FilterPopupContent/FilterPopupContent';
import {
  getUniqueArtists,
  getUniqueYears,
  getUniqueGenres,
  tracks as defaultTracks,
} from '@/data/tracks';
import styles from './Filter.module.css';

type FilterType = 'artist' | 'year' | 'genre' | null;

interface FilterProps {
  tracks?: typeof defaultTracks;
  selectedArtists?: string[];
  selectedGenres?: string[];
  onArtistToggle?: (artist: string) => void;
  onGenreToggle?: (genre: string) => void;
}

export default function Filter({
  tracks = defaultTracks,
  selectedArtists = [],
  selectedGenres = [],
  onArtistToggle,
  onGenreToggle,
}: FilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const tracksToUse =
    tracks && Array.isArray(tracks) && tracks.length > 0
      ? tracks
      : defaultTracks;

  const uniqueArtists = getUniqueArtists(tracksToUse);
  const uniqueYears = getUniqueYears(tracksToUse);
  const uniqueGenres = getUniqueGenres(tracksToUse);

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
        selectedCount={selectedArtists.length}
        popupContent={
          activeFilter === 'artist' && (
            <FilterPopupContent
              title="Исполнитель"
              items={uniqueArtists}
              filterType="artist"
              selectedItems={selectedArtists}
              onItemToggle={onArtistToggle}
            />
          )
        }
      />
      <FilterItem
        label="году выпуска"
        filterType="year"
        isActive={activeFilter === 'year'}
        onClick={() => handleFilterClick('year')}
        selectedCount={0}
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
        selectedCount={selectedGenres.length}
        popupContent={
          activeFilter === 'genre' && (
            <FilterPopupContent
              title="Жанр"
              items={uniqueGenres}
              filterType="genre"
              selectedItems={selectedGenres}
              onItemToggle={onGenreToggle}
            />
          )
        }
      />
    </div>
  );
}
