import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Filter from './Filter';
import { Track } from '@/types/track';

jest.mock('../FilterItem/FilterItem', () => {
  return function MockFilterItem({ label }: any) {
    return <div data-testid={`filter-${label}`}>{label}</div>;
  };
});

jest.mock('../FilterPopupContent/FilterPopupContent', () => {
  return function MockFilterPopupContent({ title }: any) {
    return <div data-testid={`popup-${title}`}>{title}</div>;
  };
});

describe('Filter', () => {
  const mockTracks: Track[] = [
    {
      _id: '1',
      name: 'Song 1',
      author: 'Artist 1',
      album: 'Album 1',
      duration_in_seconds: 180,
      genre: ['Rock'],
      release_date: '2020-01-01',
    },
  ];

  it('рендерит заголовок', () => {
    render(<Filter tracks={mockTracks} />);
    expect(screen.getByText('Искать по:')).toBeInTheDocument();
  });

  it('отображает фильтры если есть треки', () => {
    render(<Filter tracks={mockTracks} />);
    expect(screen.getByTestId('filter-исполнителю')).toBeInTheDocument();
    expect(screen.getByTestId('filter-году выпуска')).toBeInTheDocument();
    expect(screen.getByTestId('filter-жанру')).toBeInTheDocument();
  });

  it('не отображает фильтры если нет треков', () => {
    render(<Filter tracks={[]} />);
    expect(screen.queryByTestId('filter-исполнителю')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-году выпуска')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filter-жанру')).not.toBeInTheDocument();
  });
});
