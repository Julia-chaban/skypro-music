'use client';

import React, { useState, useMemo } from 'react';
import FilterItem from '../FilterItem/FilterItem';
import FilterPopupContent from '../FilterPopupContent/FilterPopupContent';
import { Track } from '@/types/track';
import styles from './Filter.module.css';

type FilterType = 'artist' | 'year' | 'genre' | null;

interface FilterProps {
  tracks?: Track[];
  selectedArtists?: string[];
  selectedGenres?: string[];
  onArtistToggle?: (artist: string) => void;
  onGenreToggle?: (genre: string) => void;
}

export default function Filter({
  tracks = [],
  selectedArtists = [],
  selectedGenres = [],
  onArtistToggle,
  onGenreToggle,
}: FilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  // Извлекаем уникальные данные для фильтров из API
  const uniqueArtists = useMemo(() => {
    const artists = new Set<string>();
    tracks.forEach((track) => {
      if (track.author) {
        artists.add(track.author);
      }
    });
    return Array.from(artists).sort();
  }, [tracks]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    tracks.forEach((track) => {
      if (track.release_date) {
        // Извлекаем год из даты
        const year = new Date(track.release_date).getFullYear();
        if (!isNaN(year)) {
          years.add(year.toString());
        }
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [tracks]);

  const uniqueGenres = useMemo(() => {
    const genres = new Set<string>();
    tracks.forEach((track) => {
      if (track.genre && Array.isArray(track.genre)) {
        track.genre.forEach((g) => {
          if (g && typeof g === 'string') {
            genres.add(g);
          }
        });
      }
    });
    return Array.from(genres).sort();
  }, [tracks]);

  const handleFilterClick = (filterType: FilterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  return (
    <div className={styles.centerblock__filter}>
      <div className={styles.filter__title}>Искать по:</div>
      {uniqueArtists.length > 0 && (
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
      )}
      {uniqueYears.length > 0 && (
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
      )}
      {uniqueGenres.length > 0 && (
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
      )}
    </div>
  );
}
