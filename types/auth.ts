export interface User {
  email: string;
  username: string;
  _id: number;
}

export interface AuthResponse extends User {}

export interface TokenResponse {
  refresh: string;
  access: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ErrorResponse {
  message: string;
  detail?: string;
  code?: string;
  success?: boolean;
}
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

export interface Selection {
  _id: number;
  name: string;
  author: string;
  tracks: Track[];
  logo: string | null;
}

export interface FilterOptions {
  author: string[];
  genre: string[];
  year: string[];
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

export interface FilterParams {
  author?: string;
  genre?: string;
  year?: string;
  search?: string;
}

export interface FavoriteTrack {
  track_id: number;
  user_id: number;
  added_at: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
