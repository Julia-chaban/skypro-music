// types/track.ts

// ==================== ОСНОВНЫЕ ИНТЕРФЕЙСЫ ====================

// Базовый интерфейс для трека
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
  // Дополнительные поля для UI
  likes_count?: number;
  is_liked?: boolean;
}

// Интерфейс для подборки/плейлиста
export interface Selection {
  _id: number;
  name: string;
  author: string;
  tracks: Track[];
  logo: string | null;
}

// ЯВНАЯ ТИПИЗАЦИЯ ДЛЯ RESPONSE API ПОДБОРОК
export interface SelectionResponse extends Selection {}

// ==================== ОТВЕТЫ API ====================

// Ответ для списка подборок
export interface SelectionsListResponse {
  data?: Selection[];
  selections?: Selection[];
  results?: Selection[];
  items?: Selection[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  success?: boolean;
  message?: string;
}

// Ответ для списка треков
export interface TracksListResponse {
  data?: Track[];
  tracks?: Track[];
  results?: Track[];
  items?: Track[];
  count?: number;
  success?: boolean;
  message?: string;
}

// Общий ответ API
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  detail?: string;
}

// Ответ для пагинации
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// ==================== ИЗБРАННОЕ И ЛАЙКИ ====================

// Ответ на лайк/дислайк
export interface LikeResponse {
  success: boolean;
  message?: string;
  track_id?: number;
  likes_count?: number;
  detail?: string;
}

// Ответ для избранных треков пользователя
export interface FavoriteTracksResponse {
  tracks: Track[];
  count: number;
  success?: boolean;
  message?: string;
}

// Обновленный трек с лайками
export interface UpdatedTrackResponse {
  track: Track;
  likes_count: number;
  is_liked: boolean;
}

// Запись избранного трека
export interface FavoriteTrack {
  track_id: number;
  user_id: number;
  added_at: string;
}

// ==================== API ФОРМАТЫ ====================

// ВАЖНО: Интерфейс для ответа /catalog/track/favorite/all/
// API возвращает массив подборок с ID треков, а не сами треки
export interface FavoritePlaylistsResponse {
  id: number;
  name: string;
  items: number[]; // Массив ID треков
  owner: number[];
  v?: number;
  _id?: number; // Иногда может быть _id вместо id
}

// Ответ для одного трека по ID
export interface TrackResponse {
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
  likes_count?: number;
}

// ==================== ФИЛЬТРЫ И ПОИСК ====================

// Опции фильтрации
export interface FilterOptions {
  author: string[];
  genre: string[];
  year: string[];
}

// Параметры фильтрации
export interface FilterParams {
  author?: string;
  genre?: string;
  year?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ==================== ВОСПРОИЗВЕДЕНИЕ ====================

// Состояние воспроизведения
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

// ==================== ДЛЯ REDUX STORE ====================

// Состояние треков в Redux
export interface TrackState {
  tracks: Track[];
  favoriteTracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: Track[];
  isLooping: boolean;
  isShuffling: boolean;
  shuffledPlaylist: Track[];
  filteredPlaylist: Track[];
  useFilteredPlaylist: boolean;
  likedTrackIds: number[];
  trackLikesCount: Record<number, number>;
  isFavoriteLoading: boolean;
  favoriteError: string | null;
}

// Обновление лайков
export interface TrackLikeUpdate {
  trackId: number;
  likesCount: number;
  isLiked: boolean;
}

// ==================== МЕТАДАННЫЕ ====================

// Метаданные трека
export interface TrackMetadata {
  bitrate?: number;
  samplerate?: number;
  duration: number;
  format?: string;
  size?: number;
}

// История прослушивания
export interface ListeningHistory {
  track_id: number;
  listened_at: string;
  duration_listened: number;
  user_id: number;
}

// ==================== АВТОРИЗАЦИЯ ====================

// Экспортируем интерфейсы для auth
export interface UserTrackStats {
  total_listened: number;
  favorite_tracks_count: number;
  favorite_genres: string[];
}

// ==================== ДОПОЛНИТЕЛЬНО ====================

// Для отладки и логирования
export interface DebugTrackInfo {
  trackId: number;
  trackName: string;
  isLiked: boolean;
  likesCount: number;
  inFavorites: boolean;
}

// Типы для обработки ошибок
export interface ApiErrorData {
  status?: number;
  message: string;
  detail?: string;
  code?: string;
  timestamp?: string;
}

// Экспорт всех типов
export type {
  // Реэкспортируем для удобства
  Track as ITrack,
  Selection as ISelection,
  FilterParams as IFilterParams,
  LikeResponse as ILikeResponse,
};
