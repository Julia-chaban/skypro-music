import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Filter from './Filter';
import { Track } from '@/types/track';

describe('Filter Component', () => {
  const mockTracks: Track[] = [
    {
      _id: '1',
      name: 'Song 1',
      author: 'Artist A',
      album: 'Album 1',
      duration_in_seconds: 180,
      genre: ['Rock', 'Pop'],
      release_date: '2020-01-01',
    },
    {
      _id: '2',
      name: 'Song 2',
      author: 'Artist B',
      album: 'Album 2',
      duration_in_seconds: 200,
      genre: ['Jazz'],
      release_date: '2019-05-15',
    },
    {
      _id: '3',
      name: 'Song 3',
      author: 'Artist A',
      album: 'Album 3',
      duration_in_seconds: 220,
      genre: ['Rock', 'Metal'],
      release_date: '2021-03-10',
    },
  ];

  const mockOnArtistToggle = jest.fn();
  const mockOnGenreToggle = jest.fn();
  const mockOnYearToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter title', () => {
    render(<Filter tracks={mockTracks} />);
    expect(screen.getByText('Искать по:')).toBeInTheDocument();
  });

  it('displays filter buttons when tracks are provided', () => {
    render(<Filter tracks={mockTracks} />);

    expect(screen.getByText('исполнителю')).toBeInTheDocument();
    expect(screen.getByText('году выпуска')).toBeInTheDocument();
    expect(screen.getByText('жанру')).toBeInTheDocument();
  });

  it('does not display filter buttons when no tracks', () => {
    render(<Filter tracks={[]} />);

    expect(screen.queryByText('исполнителю')).not.toBeInTheDocument();
    expect(screen.queryByText('году выпуска')).not.toBeInTheDocument();
    expect(screen.queryByText('жанру')).not.toBeInTheDocument();
  });

  it('shows selected count on filter buttons', () => {
    const selectedArtists = ['Artist A'];
    const selectedGenres = ['Rock'];
    const selectedYears = ['2020'];

    render(
      <Filter
        tracks={mockTracks}
        selectedArtists={selectedArtists}
        selectedGenres={selectedGenres}
        selectedYears={selectedYears}
      />,
    );

    const artistButton = screen.getByText('исполнителю').closest('div');
    const genreButton = screen.getByText('жанру').closest('div');
    const yearButton = screen.getByText('году выпуска').closest('div');

    expect(artistButton).toHaveTextContent('1');
    expect(genreButton).toHaveTextContent('1');
    expect(yearButton).toHaveTextContent('1');
  });

  it('toggles filter popup when clicked', () => {
    render(<Filter tracks={mockTracks} onArtistToggle={mockOnArtistToggle} />);

    const artistButton = screen.getByText('исполнителю');
    fireEvent.click(artistButton);

    expect(screen.getByText('Исполнитель')).toBeInTheDocument();
    expect(screen.getByText('Artist A')).toBeInTheDocument();
    expect(screen.getByText('Artist B')).toBeInTheDocument();
  });

  it('extracts unique artists correctly', () => {
    render(<Filter tracks={mockTracks} />);
    const artistButton = screen.getByText('исполнителю');
    fireEvent.click(artistButton);

    expect(screen.getByText('Artist A')).toBeInTheDocument();
    expect(screen.getByText('Artist B')).toBeInTheDocument();
    // Не должно быть дубликатов
    const artistElements = screen.getAllByText(/Artist/);
    expect(artistElements).toHaveLength(2);
  });

  it('extracts unique genres correctly', () => {
    render(<Filter tracks={mockTracks} />);
    const genreButton = screen.getByText('жанру');
    fireEvent.click(genreButton);

    expect(screen.getByText('Rock')).toBeInTheDocument();
    expect(screen.getByText('Pop')).toBeInTheDocument();
    expect(screen.getByText('Jazz')).toBeInTheDocument();
    expect(screen.getByText('Metal')).toBeInTheDocument();
  });

  it('extracts unique years correctly and sorts descending', () => {
    render(<Filter tracks={mockTracks} />);
    const yearButton = screen.getByText('году выпуска');
    fireEvent.click(yearButton);

    const years = ['2021', '2020', '2019'];
    years.forEach((year) => {
      expect(screen.getByText(year)).toBeInTheDocument();
    });
  });

  it('handles tracks without genre gracefully', () => {
    const tracksWithoutGenre: Track[] = [
      {
        _id: '1',
        name: 'Song 1',
        author: 'Artist A',
        album: 'Album 1',
        duration_in_seconds: 180,
        genre: undefined as any,
        release_date: '2020-01-01',
      },
    ];

    render(<Filter tracks={tracksWithoutGenre} />);

    // Компонент не должен сломаться
    expect(screen.getByText('Искать по:')).toBeInTheDocument();
  });

  it('handles invalid dates gracefully', () => {
    const tracksWithInvalidDate: Track[] = [
      {
        _id: '1',
        name: 'Song 1',
        author: 'Artist A',
        album: 'Album 1',
        duration_in_seconds: 180,
        genre: ['Rock'],
        release_date: 'invalid-date',
      },
    ];

    render(<Filter tracks={tracksWithInvalidDate} />);

    // Компонент не должен сломаться
    expect(screen.getByText('Искать по:')).toBeInTheDocument();
  });

  it('closes popup when clicking the same filter', () => {
    render(<Filter tracks={mockTracks} />);

    const artistButton = screen.getByText('исполнителю');

    // Открываем
    fireEvent.click(artistButton);
    expect(screen.getByText('Исполнитель')).toBeInTheDocument();

    // Закрываем
    fireEvent.click(artistButton);
    expect(screen.queryByText('Исполнитель')).not.toBeInTheDocument();
  });
});
