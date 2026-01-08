// @/store/features/trackSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '@/types/track';

type initialStateType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playlist: Track[];
  currentTrackIndex: number;
  isLooping: boolean;
  isShuffling: boolean;
};

const initialState: initialStateType = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.5,
  currentTime: 0,
  duration: 0,
  playlist: [],
  currentTrackIndex: -1,
  isLooping: false,
  isShuffling: false,
};

const trackSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
      state.isPlaying = true;
      state.currentTime = 0;

      // Находим индекс трека в плейлисте
      const index = state.playlist.findIndex(
        (track) => track._id === action.payload._id,
      );
      if (index !== -1) {
        state.currentTrackIndex = index;
      }
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setPlaylist: (state, action: PayloadAction<Track[]>) => {
      state.playlist = action.payload;
    },
    setCurrentTrackIndex: (state, action: PayloadAction<number>) => {
      state.currentTrackIndex = action.payload;
      if (action.payload >= 0 && action.payload < state.playlist.length) {
        state.currentTrack = state.playlist[action.payload];
        state.isPlaying = true;
        state.currentTime = 0;
      }
    },
    togglePlaying: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    toggleLooping: (state) => {
      state.isLooping = !state.isLooping;
    },
    toggleShuffling: (state) => {
      state.isShuffling = !state.isShuffling;
    },
    nextTrack: (state) => {
      if (state.playlist.length > 0) {
        if (state.isShuffling) {
          const randomIndex = Math.floor(Math.random() * state.playlist.length);
          state.currentTrackIndex = randomIndex;
        } else {
          state.currentTrackIndex =
            (state.currentTrackIndex + 1) % state.playlist.length;
        }
        state.currentTrack = state.playlist[state.currentTrackIndex];
        state.currentTime = 0;
        state.isPlaying = true;
      }
    },
    prevTrack: (state) => {
      if (state.playlist.length > 0) {
        if (state.isShuffling) {
          const randomIndex = Math.floor(Math.random() * state.playlist.length);
          state.currentTrackIndex = randomIndex;
        } else {
          state.currentTrackIndex =
            state.currentTrackIndex > 0
              ? state.currentTrackIndex - 1
              : state.playlist.length - 1;
        }
        state.currentTrack = state.playlist[state.currentTrackIndex];
        state.currentTime = 0;
        state.isPlaying = true;
      }
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
  },
});

export const {
  setCurrentTrack,
  setIsPlaying,
  setVolume,
  setCurrentTime,
  setDuration,
  setPlaylist,
  setCurrentTrackIndex,
  togglePlaying,
  toggleLooping,
  toggleShuffling,
  nextTrack,
  prevTrack,
  setProgress,
} = trackSlice.actions;

export const trackSliceReducer = trackSlice.reducer;
