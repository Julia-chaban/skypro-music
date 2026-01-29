export interface Track {
  _id: number;
  name: string;
  author: string;
  release_date: string;
  genre: string[];
  duration_in_seconds: number;
  album: string;
  logo: string | null;
  track_file: string;
  stared_user: number[];
}

// Интерфейс для подборки/селекции
export interface Selection {
  _id: number;
  name: string;
  author: string;
  tracks: Track[];
  logo: string | null;
}

// ЯВНАЯ ТИПИЗАЦИЯ ДЛЯ RESPONSE API ПОДБОРОК
export interface SelectionResponse extends Selection {}

export interface SelectionsListResponse {
  data?: Selection[];
  selections?: Selection[];
  results?: Selection[];
  items?: Selection[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export interface TracksListResponse {
  data?: Track[];
  tracks?: Track[];
  results?: Track[];
  items?: Track[];
  count?: number;
}

// Интерфейс для опций фильтрации
export interface FilterOptions {
  author: string[];
  genre: string[];
  year: string[];
}

// 1. Интерфейс для ответа API
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

// 2. Интерфейс для параметров фильтрации
export interface FilterParams {
  author?: string;
  genre?: string;
  year?: string;
  search?: string;
}

// 3. Интерфейс для избранных треков
export interface FavoriteTrack {
  track_id: number;
  user_id: number;
  added_at: string;
}

// 4. Дополнительные интерфейсы для пагинации
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// 5. Интерфейс для состояния воспроизведения трека
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
