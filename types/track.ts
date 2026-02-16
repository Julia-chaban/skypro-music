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
  likes_count?: number;
  is_liked?: boolean;
}

export interface Selection {
  _id: number;
  name: string;
  author: string;
  tracks: Track[];
  logo: string | null;
}

export interface SelectionResponse extends Selection {}

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

export interface TracksListResponse {
  data?: Track[];
  tracks?: Track[];
  results?: Track[];
  items?: Track[];
  count?: number;
  success?: boolean;
  message?: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  detail?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface LikeResponse {
  success: boolean;
  message?: string;
  track_id?: number;
  likes_count?: number;
  detail?: string;
}

export interface FavoriteTracksResponse {
  tracks: Track[];
  count: number;
  success?: boolean;
  message?: string;
}

export interface UpdatedTrackResponse {
  track: Track;
  likes_count: number;
  is_liked: boolean;
}

export interface FavoriteTrack {
  track_id: number;
  user_id: number;
  added_at: string;
}

export interface FavoritePlaylistsResponse {
  id: number;
  name: string;
  items: number[];
  owner: number[];
  v?: number;
  _id?: number;
}

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

export interface FilterOptions {
  author: string[];
  genre: string[];
  year: string[];
}

export interface FilterParams {
  author?: string;
  genre?: string;
  year?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

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

export interface TrackLikeUpdate {
  trackId: number;
  likesCount: number;
  isLiked: boolean;
}

export interface TrackMetadata {
  bitrate?: number;
  samplerate?: number;
  duration: number;
  format?: string;
  size?: number;
}

export interface ListeningHistory {
  track_id: number;
  listened_at: string;
  duration_listened: number;
  user_id: number;
}

export interface UserTrackStats {
  total_listened: number;
  favorite_tracks_count: number;
  favorite_genres: string[];
}

export interface DebugTrackInfo {
  trackId: number;
  trackName: string;
  isLiked: boolean;
  likesCount: number;
  inFavorites: boolean;
}

export interface ApiErrorData {
  status?: number;
  message: string;
  detail?: string;
  code?: string;
  timestamp?: string;
}
export type {
  Track as ITrack,
  Selection as ISelection,
  FilterParams as IFilterParams,
  LikeResponse as ILikeResponse,
};
