// store/features/trackSlice.ts
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
  // Добавляем состояние для избранного
  favoriteTracks: Track[];
  isFavoriteLoading: boolean;
  favoriteError: string | null;
  // Заменяем Set на массив для сериализации
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
  // Новые поля
  favoriteTracks: [],
  isFavoriteLoading: false,
  favoriteError: null,
  likedTrackIds: [], // Теперь массив вместо Set
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

      // Определяем активный плейлист
      const activePlaylist = state.useFilteredPlaylist
        ? state.filteredPlaylist
        : state.playlist;

      // Находим индекс трека в активном плейлисте
      const index = activePlaylist.findIndex((t) => t._id === track._id);

      if (index !== -1) {
        state.currentTrackIndex = index;
      } else {
        // Если трека нет в активном плейлисте, добавляем его как единственный
        state.playlist = [track];
        state.filteredPlaylist = [track];
        state.shuffledPlaylist = [track];
        state.currentTrackIndex = 0;
      }
    },

    setPlaylist: (state, action: PayloadAction<Track[]>) => {
      const playlist = action.payload;
      state.playlist = playlist;

      // При установке нового плейлиста также создаем перемешанную версию
      if (state.isShuffling) {
        // Если shuffle включен, перемешиваем
        const shuffled = [...playlist];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        state.shuffledPlaylist = shuffled;
      } else {
        // Если shuffle выключен, просто копируем
        state.shuffledPlaylist = [...playlist];
      }

      // Если есть текущий трек, обновляем его индекс
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
          // Если текущего трека нет в новом плейлисте, сбрасываем
          state.currentTrack = null;
          state.currentTrackIndex = -1;
          state.isPlaying = false;
        }
      }
    },

    setFilteredPlaylist: (state, action: PayloadAction<Track[]>) => {
      state.filteredPlaylist = action.payload;
      state.useFilteredPlaylist = action.payload.length > 0;

      // Обновляем shuffledPlaylist для фильтрованного плейлиста
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

      // Если есть текущий трек, проверяем есть ли он в фильтрованном плейлисте
      if (state.currentTrack && state.useFilteredPlaylist) {
        const index = state.filteredPlaylist.findIndex(
          (track) => track._id === state.currentTrack?._id,
        );
        if (index !== -1) {
          state.currentTrackIndex = index;
        } else if (state.filteredPlaylist.length > 0) {
          // Если текущего трека нет в фильтрованном, выбираем первый
          state.currentTrack = state.filteredPlaylist[0];
          state.currentTrackIndex = 0;
          state.currentTime = 0;
        }
      }
    },

    resetFilteredPlaylist: (state) => {
      state.useFilteredPlaylist = false;

      // Обновляем shuffledPlaylist для основного плейлиста
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
        // В зависимости от режима shuffle выбираем трек из соответствующего плейлиста
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
        // ВКЛЮЧЕНИЕ SHUFFLE - перемешиваем треки
        const activePlaylist = state.useFilteredPlaylist
          ? state.filteredPlaylist
          : state.playlist;

        if (activePlaylist.length > 0) {
          // Создаем перемешанную копию
          const shuffled = [...activePlaylist];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          state.shuffledPlaylist = shuffled;

          // Обновляем индекс текущего трека в перемешанном плейлисте
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
        // ВЫКЛЮЧЕНИЕ SHUFFLE - возвращаемся к обычному порядку
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
          // Каждый раз при новом включении перемешиваем заново
          const shuffled = [...activePlaylist];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          state.shuffledPlaylist = shuffled;

          // Обновляем индекс текущего трека
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

      // Выбираем плейлист в зависимости от режима shuffle
      const playlist = state.isShuffling
        ? state.shuffledPlaylist
        : activePlaylist;

      if (playlist.length > 0) {
        let nextIndex = state.currentTrackIndex + 1;

        // Проверяем, достигли ли конца плейлиста
        if (nextIndex >= playlist.length) {
          if (state.isLooping) {
            // Если включен loop - начинаем сначала
            nextIndex = 0;
          } else {
            // Если loop выключен - останавливаем воспроизведение
            state.isPlaying = false;
            return;
          }
        }

        // Обновляем текущий трек
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

      // Выбираем плейлист в зависимости от режима shuffle
      const playlist = state.isShuffling
        ? state.shuffledPlaylist
        : activePlaylist;

      if (playlist.length > 0) {
        let prevIndex = state.currentTrackIndex - 1;

        // Проверяем, достигли ли начала плейлиста
        if (prevIndex < 0) {
          if (state.isLooping) {
            // Если включен loop - переходим к последнему треку
            prevIndex = playlist.length - 1;
          } else {
            // Если loop выключен - останавливаем воспроизведение
            state.isPlaying = false;
            return;
          }
        }

        // Обновляем текущий трек
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

    // НОВЫЕ РЕДУКТОРЫ ДЛЯ ЛАЙКОВ

    // Загрузка избранных треков
    setFavoriteTracks: (state, action: PayloadAction<Track[]>) => {
      state.favoriteTracks = action.payload;

      // Обновляем likedTrackIds и trackLikesCount
      action.payload.forEach((track) => {
        // Добавляем ID трека в массив, если его там нет
        if (!state.likedTrackIds.includes(track._id)) {
          state.likedTrackIds.push(track._id);
        }
        state.trackLikesCount[track._id] = track.likes_count || 0;
      });
    },

    // Установка состояния загрузки избранного
    setFavoriteLoading: (state, action: PayloadAction<boolean>) => {
      state.isFavoriteLoading = action.payload;
    },

    // Установка ошибки избранного
    setFavoriteError: (state, action: PayloadAction<string | null>) => {
      state.favoriteError = action.payload;
    },

    // Добавление трека в избранное
    addToFavorites: (state, action: PayloadAction<Track>) => {
      const track = action.payload;

      // Добавляем трек в массив избранных, если его там нет
      if (!state.favoriteTracks.some((t) => t._id === track._id)) {
        state.favoriteTracks.push({
          ...track,
          is_liked: true,
          likes_count: (track.likes_count || 0) + 1,
        });
      }

      // Добавляем ID трека в массив, если его там нет
      if (!state.likedTrackIds.includes(track._id)) {
        state.likedTrackIds.push(track._id);
      }

      // Обновляем счетчик лайков
      state.trackLikesCount[track._id] =
        (state.trackLikesCount[track._id] || 0) + 1;

      // Обновляем текущий трек, если это он
      if (state.currentTrack && state.currentTrack._id === track._id) {
        state.currentTrack = {
          ...state.currentTrack,
          is_liked: true,
          likes_count: (state.currentTrack.likes_count || 0) + 1,
        };
      }

      // Обновляем треки в плейлистах
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

    // Удаление трека из избранного
    removeFromFavorites: (state, action: PayloadAction<number>) => {
      const trackId = action.payload;

      // Удаляем трек из массива избранных
      state.favoriteTracks = state.favoriteTracks.filter(
        (track) => track._id !== trackId,
      );

      // Удаляем ID трека из массива
      state.likedTrackIds = state.likedTrackIds.filter((id) => id !== trackId);

      // Обновляем счетчик лайков
      const currentCount = state.trackLikesCount[trackId] || 0;
      state.trackLikesCount[trackId] = Math.max(0, currentCount - 1);

      // Обновляем текущий трек, если это он
      if (state.currentTrack && state.currentTrack._id === trackId) {
        state.currentTrack = {
          ...state.currentTrack,
          is_liked: false,
          likes_count: Math.max(0, (state.currentTrack.likes_count || 1) - 1),
        };
      }

      // Обновляем треки в плейлистах
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

    // Тоггл лайка (общий метод)
    toggleLike: (
      state,
      action: PayloadAction<{ trackId: number; isLiked: boolean }>,
    ) => {
      const { trackId, isLiked } = action.payload;

      if (isLiked) {
        // Находим трек для добавления
        const trackToAdd = [
          ...state.playlist,
          ...state.filteredPlaylist,
          ...state.shuffledPlaylist,
          state.currentTrack,
        ].find((t) => t && t._id === trackId);

        if (trackToAdd) {
          // Используем существующий редуктор для добавления
          trackSlice.caseReducers.addToFavorites(state, {
            type: 'tracks/addToFavorites',
            payload: trackToAdd,
          });
        }
      } else {
        // Используем существующий редуктор для удаления
        trackSlice.caseReducers.removeFromFavorites(state, {
          type: 'tracks/removeFromFavorites',
          payload: trackId,
        });
      }
    },

    // Обновление счетчика лайков для трека
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
        // Добавляем ID если его нет
        if (!state.likedTrackIds.includes(trackId)) {
          state.likedTrackIds.push(trackId);
        }
      } else {
        // Удаляем ID если есть
        state.likedTrackIds = state.likedTrackIds.filter(
          (id) => id !== trackId,
        );
      }

      // Обновляем текущий трек
      if (state.currentTrack && state.currentTrack._id === trackId) {
        state.currentTrack = {
          ...state.currentTrack,
          is_liked: isLiked,
          likes_count: likesCount,
        };
      }

      // Обновляем треки в плейлистах
      const updateTrackInArray = (track: Track) =>
        track._id === trackId
          ? { ...track, is_liked: isLiked, likes_count: likesCount }
          : track;

      state.playlist = state.playlist.map(updateTrackInArray);
      state.filteredPlaylist = state.filteredPlaylist.map(updateTrackInArray);
      state.shuffledPlaylist = state.shuffledPlaylist.map(updateTrackInArray);
      state.favoriteTracks = state.favoriteTracks.map(updateTrackInArray);
    },

    // Очистка состояния избранного при выходе
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
  // Новые экшены
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
