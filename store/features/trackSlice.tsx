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
  shuffledPlaylist: Track[];
  filteredPlaylist: Track[];
  useFilteredPlaylist: boolean;

  favoriteTracks: Track[];
  isFavoriteLoading: boolean;
  favoriteError: string | null;

  likedTrackIds: number[];
  trackLikesCount: Record<number, number>;
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
  shuffledPlaylist: [],
  filteredPlaylist: [],
  useFilteredPlaylist: false,

  favoriteTracks: [],
  isFavoriteLoading: false,
  favoriteError: null,
  likedTrackIds: [],
  trackLikesCount: {},
};

const trackSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track>) => {
      const track = action.payload;
      state.currentTrack = track;
      state.isPlaying = true;
      state.currentTime = 0;

      const activePlaylist = state.useFilteredPlaylist
        ? state.filteredPlaylist
        : state.playlist;

      const index = activePlaylist.findIndex((t) => t._id === track._id);

      if (index !== -1) {
        state.currentTrackIndex = index;
      } else {
        state.playlist = [track];
        state.filteredPlaylist = [track];
        state.shuffledPlaylist = [track];
        state.currentTrackIndex = 0;
      }
    },

    setPlaylist: (state, action: PayloadAction<Track[]>) => {
      const playlist = action.payload;
      state.playlist = playlist;

      if (state.isShuffling) {
        const shuffled = [...playlist];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        state.shuffledPlaylist = shuffled;
      } else {
        state.shuffledPlaylist = [...playlist];
      }

      if (state.currentTrack) {
        const activePlaylist = state.useFilteredPlaylist
          ? state.filteredPlaylist
          : state.playlist;

        const index = activePlaylist.findIndex(
          (track) => track._id === state.currentTrack?._id,
        );
        if (index !== -1) {
          state.currentTrackIndex = index;
        } else {
          state.currentTrack = null;
          state.currentTrackIndex = -1;
          state.isPlaying = false;
        }
      }
    },

    setFilteredPlaylist: (state, action: PayloadAction<Track[]>) => {
      state.filteredPlaylist = action.payload;
      state.useFilteredPlaylist = action.payload.length > 0;

      if (state.isShuffling && state.filteredPlaylist.length > 0) {
        const shuffled = [...state.filteredPlaylist];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        state.shuffledPlaylist = shuffled;
      } else if (state.filteredPlaylist.length > 0) {
        state.shuffledPlaylist = [...state.filteredPlaylist];
      }

      if (state.currentTrack && state.useFilteredPlaylist) {
        const index = state.filteredPlaylist.findIndex(
          (track) => track._id === state.currentTrack?._id,
        );
        if (index !== -1) {
          state.currentTrackIndex = index;
        } else if (state.filteredPlaylist.length > 0) {
          state.currentTrack = state.filteredPlaylist[0];
          state.currentTrackIndex = 0;
          state.currentTime = 0;
        }
      }
    },

    resetFilteredPlaylist: (state) => {
      state.useFilteredPlaylist = false;

      if (state.isShuffling && state.playlist.length > 0) {
        const shuffled = [...state.playlist];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        state.shuffledPlaylist = shuffled;
      } else {
        state.shuffledPlaylist = [...state.playlist];
      }

      if (state.currentTrack) {
        const index = state.playlist.findIndex(
          (track) => track._id === state.currentTrack?._id,
        );
        if (index !== -1) {
          state.currentTrackIndex = index;
        }
      }
    },

    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },

    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(1, action.payload));
    },

    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },

    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },

    setCurrentTrackIndex: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      const activePlaylist = state.useFilteredPlaylist
        ? state.filteredPlaylist
        : state.playlist;

      if (index >= 0 && index < activePlaylist.length) {
        state.currentTrackIndex = index;

        state.currentTrack = state.isShuffling
          ? state.shuffledPlaylist[index]
          : activePlaylist[index];
        state.isPlaying = true;
        state.currentTime = 0;
      }
    },

    togglePlaying: (state) => {
      if (state.currentTrack) {
        state.isPlaying = !state.isPlaying;
      }
    },

    toggleLooping: (state) => {
      state.isLooping = !state.isLooping;
    },

    toggleShuffling: (state) => {
      const wasShuffling = state.isShuffling;
      state.isShuffling = !state.isShuffling;

      if (!wasShuffling && state.isShuffling) {
        const activePlaylist = state.useFilteredPlaylist
          ? state.filteredPlaylist
          : state.playlist;

        if (activePlaylist.length > 0) {
          const shuffled = [...activePlaylist];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          state.shuffledPlaylist = shuffled;

          if (state.currentTrack) {
            const index = shuffled.findIndex(
              (track) => track._id === state.currentTrack?._id,
            );
            if (index !== -1) {
              state.currentTrackIndex = index;
            }
          }
        }
      } else if (wasShuffling && !state.isShuffling) {
        if (state.currentTrack) {
          const activePlaylist = state.useFilteredPlaylist
            ? state.filteredPlaylist
            : state.playlist;

          const index = activePlaylist.findIndex(
            (track) => track._id === state.currentTrack?._id,
          );
          if (index !== -1) {
            state.currentTrackIndex = index;
          }
        }
      }
    },

    reshufflePlaylist: (state) => {
      if (state.isShuffling) {
        const activePlaylist = state.useFilteredPlaylist
          ? state.filteredPlaylist
          : state.playlist;

        if (activePlaylist.length > 0) {
          const shuffled = [...activePlaylist];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          state.shuffledPlaylist = shuffled;

          if (state.currentTrack) {
            const index = shuffled.findIndex(
              (track) => track._id === state.currentTrack?._id,
            );
            if (index !== -1) {
              state.currentTrackIndex = index;
            }
          }
        }
      }
    },

    nextTrack: (state) => {
      const activePlaylist = state.useFilteredPlaylist
        ? state.filteredPlaylist
        : state.playlist;

      if (activePlaylist.length === 0) return;

      const playlist = state.isShuffling
        ? state.shuffledPlaylist
        : activePlaylist;

      if (playlist.length > 0) {
        let nextIndex = state.currentTrackIndex + 1;

        if (nextIndex >= playlist.length) {
          if (state.isLooping) {
            nextIndex = 0;
          } else {
            state.isPlaying = false;
            return;
          }
        }

        state.currentTrackIndex = nextIndex;
        state.currentTrack = playlist[nextIndex];
        state.currentTime = 0;
        state.isPlaying = true;
      }
    },

    prevTrack: (state) => {
      const activePlaylist = state.useFilteredPlaylist
        ? state.filteredPlaylist
        : state.playlist;

      if (activePlaylist.length === 0) return;

      const playlist = state.isShuffling
        ? state.shuffledPlaylist
        : activePlaylist;

      if (playlist.length > 0) {
        let prevIndex = state.currentTrackIndex - 1;

        if (prevIndex < 0) {
          if (state.isLooping) {
            prevIndex = playlist.length - 1;
          } else {
            state.isPlaying = false;
            return;
          }
        }

        state.currentTrackIndex = prevIndex;
        state.currentTrack = playlist[prevIndex];
        state.currentTime = 0;
        state.isPlaying = true;
      }
    },

    setProgress: (state, action: PayloadAction<number>) => {
      state.currentTime = Math.max(0, Math.min(state.duration, action.payload));
    },

    clearTrack: (state) => {
      state.currentTrack = null;
      state.isPlaying = false;
      state.currentTime = 0;
      state.duration = 0;
      state.currentTrackIndex = -1;
    },

    setFavoriteTracks: (state, action: PayloadAction<Track[]>) => {
      state.favoriteTracks = action.payload;

      action.payload.forEach((track) => {
        if (!state.likedTrackIds.includes(track._id)) {
          state.likedTrackIds.push(track._id);
        }
        state.trackLikesCount[track._id] = track.likes_count || 0;
      });
    },

    setFavoriteLoading: (state, action: PayloadAction<boolean>) => {
      state.isFavoriteLoading = action.payload;
    },
    setFavoriteError: (state, action: PayloadAction<string | null>) => {
      state.favoriteError = action.payload;
    },

    addToFavorites: (state, action: PayloadAction<Track>) => {
      const track = action.payload;

      if (!state.favoriteTracks.some((t) => t._id === track._id)) {
        state.favoriteTracks.push({
          ...track,
          is_liked: true,
          likes_count: (track.likes_count || 0) + 1,
        });
      }

      if (!state.likedTrackIds.includes(track._id)) {
        state.likedTrackIds.push(track._id);
      }

      state.trackLikesCount[track._id] =
        (state.trackLikesCount[track._id] || 0) + 1;

      if (state.currentTrack && state.currentTrack._id === track._id) {
        state.currentTrack = {
          ...state.currentTrack,
          is_liked: true,
          likes_count: (state.currentTrack.likes_count || 0) + 1,
        };
      }

      state.playlist = state.playlist.map((t) =>
        t._id === track._id
          ? { ...t, is_liked: true, likes_count: (t.likes_count || 0) + 1 }
          : t,
      );

      state.filteredPlaylist = state.filteredPlaylist.map((t) =>
        t._id === track._id
          ? { ...t, is_liked: true, likes_count: (t.likes_count || 0) + 1 }
          : t,
      );

      state.shuffledPlaylist = state.shuffledPlaylist.map((t) =>
        t._id === track._id
          ? { ...t, is_liked: true, likes_count: (t.likes_count || 0) + 1 }
          : t,
      );
    },

    removeFromFavorites: (state, action: PayloadAction<number>) => {
      const trackId = action.payload;

      state.favoriteTracks = state.favoriteTracks.filter(
        (track) => track._id !== trackId,
      );

      state.likedTrackIds = state.likedTrackIds.filter((id) => id !== trackId);

      const currentCount = state.trackLikesCount[trackId] || 0;
      state.trackLikesCount[trackId] = Math.max(0, currentCount - 1);

      if (state.currentTrack && state.currentTrack._id === trackId) {
        state.currentTrack = {
          ...state.currentTrack,
          is_liked: false,
          likes_count: Math.max(0, (state.currentTrack.likes_count || 1) - 1),
        };
      }

      state.playlist = state.playlist.map((t) =>
        t._id === trackId
          ? {
              ...t,
              is_liked: false,
              likes_count: Math.max(0, (t.likes_count || 1) - 1),
            }
          : t,
      );

      state.filteredPlaylist = state.filteredPlaylist.map((t) =>
        t._id === trackId
          ? {
              ...t,
              is_liked: false,
              likes_count: Math.max(0, (t.likes_count || 1) - 1),
            }
          : t,
      );

      state.shuffledPlaylist = state.shuffledPlaylist.map((t) =>
        t._id === trackId
          ? {
              ...t,
              is_liked: false,
              likes_count: Math.max(0, (t.likes_count || 1) - 1),
            }
          : t,
      );
    },

    toggleLike: (
      state,
      action: PayloadAction<{ trackId: number; isLiked: boolean }>,
    ) => {
      const { trackId, isLiked } = action.payload;

      if (isLiked) {
        const trackToAdd = [
          ...state.playlist,
          ...state.filteredPlaylist,
          ...state.shuffledPlaylist,
          state.currentTrack,
        ].find((t) => t && t._id === trackId);

        if (trackToAdd) {
          trackSlice.caseReducers.addToFavorites(state, {
            type: 'tracks/addToFavorites',
            payload: trackToAdd,
          });
        }
      } else {
        trackSlice.caseReducers.removeFromFavorites(state, {
          type: 'tracks/removeFromFavorites',
          payload: trackId,
        });
      }
    },

    updateTrackLikes: (
      state,
      action: PayloadAction<{
        trackId: number;
        likesCount: number;
        isLiked: boolean;
      }>,
    ) => {
      const { trackId, likesCount, isLiked } = action.payload;

      state.trackLikesCount[trackId] = likesCount;

      if (isLiked) {
        if (!state.likedTrackIds.includes(trackId)) {
          state.likedTrackIds.push(trackId);
        }
      } else {
        state.likedTrackIds = state.likedTrackIds.filter(
          (id) => id !== trackId,
        );
      }

      if (state.currentTrack && state.currentTrack._id === trackId) {
        state.currentTrack = {
          ...state.currentTrack,
          is_liked: isLiked,
          likes_count: likesCount,
        };
      }

      const updateTrackInArray = (track: Track) =>
        track._id === trackId
          ? { ...track, is_liked: isLiked, likes_count: likesCount }
          : track;

      state.playlist = state.playlist.map(updateTrackInArray);
      state.filteredPlaylist = state.filteredPlaylist.map(updateTrackInArray);
      state.shuffledPlaylist = state.shuffledPlaylist.map(updateTrackInArray);
      state.favoriteTracks = state.favoriteTracks.map(updateTrackInArray);
    },

    clearFavorites: (state) => {
      state.favoriteTracks = [];
      state.likedTrackIds = [];
      state.trackLikesCount = {};
      state.isFavoriteLoading = false;
      state.favoriteError = null;
    },
  },
});

export const {
  setCurrentTrack,
  setPlaylist,
  setFilteredPlaylist,
  resetFilteredPlaylist,
  setIsPlaying,
  setVolume,
  setCurrentTime,
  setDuration,
  setCurrentTrackIndex,
  togglePlaying,
  toggleLooping,
  toggleShuffling,
  reshufflePlaylist,
  nextTrack,
  prevTrack,
  setProgress,
  clearTrack,

  setFavoriteTracks,
  setFavoriteLoading,
  setFavoriteError,
  addToFavorites,
  removeFromFavorites,
  toggleLike,
  updateTrackLikes,
  clearFavorites,
} = trackSlice.actions;

export const trackSliceReducer = trackSlice.reducer;
