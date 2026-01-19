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
  // ДОБАВЛЯЕМ только это:
  filteredPlaylist: Track[]; // Новое поле для фильтрованных треков
  useFilteredPlaylist: boolean; // Флаг использования фильтрованного плейлиста
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
  // ДОБАВЛЯЕМ:
  filteredPlaylist: [],
  useFilteredPlaylist: false,
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

      // ОПРЕДЕЛЯЕМ активный плейлист
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
        // При создании нового плейлиста также создаем перемешанную версию
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

    // ДОБАВЛЯЕМ новый action для установки фильтрованного плейлиста
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

    // ДОБАВЛЯЕМ action для сброса фильтрации
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
      // ВКЛЮЧЕНИЕ/ВЫКЛЮЧЕНИЕ ЗАЦИКЛИВАНИЯ ТРЕКА
      state.isLooping = !state.isLooping;
      console.log('Looping:', state.isLooping);
    },

    toggleShuffling: (state) => {
      const wasShuffling = state.isShuffling;
      state.isShuffling = !state.isShuffling;
      console.log('Shuffling:', state.isShuffling);

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

    // ФУНКЦИЯ ДЛЯ ПОВТОРНОГО ПЕРЕМЕШИВАНИЯ ТРЕКОВ
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

    // СЛЕДУЮЩИЙ ТРЕК (работает с shuffle и loop)
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

    // ПРЕДЫДУЩИЙ ТРЕК (работает с shuffle и loop)
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
  },
});

export const {
  setCurrentTrack,
  setPlaylist,
  // ДОБАВЛЯЕМ экспорт новых actions:
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
  reshufflePlaylist, // Экспортируем функцию для повторного перемешивания
  nextTrack,
  prevTrack,
  setProgress,
  clearTrack,
} = trackSlice.actions;

export const trackSliceReducer = trackSlice.reducer;
