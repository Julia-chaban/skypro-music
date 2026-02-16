import { Track, TracksListResponse } from '@/types/track';
import { fetchApi } from '@/utils/api';

export const API_ENDPOINTS = {
  ALL_TRACKS: '/catalog/track/all/',
  ALL_SELECTIONS: '/catalog/selection/all/',
} as const;

export interface SelectionItem {
  _id?: number;
  id?: number;
  items?: number[];
}

export interface SelectionsResponse {
  data?: SelectionItem[];
  [key: string]: any;
}

export const fetchAllTracks = async (): Promise<Track[]> => {
  try {
    const data = await fetchApi<TracksListResponse>(API_ENDPOINTS.ALL_TRACKS);

    let tracksArray: Track[] = [];

    if (Array.isArray(data)) {
      tracksArray = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) {
        tracksArray = data.data;
      } else if (Array.isArray(data.tracks)) {
        tracksArray = data.tracks;
      } else if (Array.isArray(data.results)) {
        tracksArray = data.results;
      } else if (Array.isArray(data.items)) {
        tracksArray = data.items;
      } else {
        const arrayValues = Object.values(data).filter(Array.isArray);
        if (arrayValues.length > 0) {
          tracksArray = arrayValues[0] as Track[];
        }
      }
    }

    return tracksArray;
  } catch (error) {
    throw error;
  }
};

export const findSelectionInObject = (
  obj: any,
  targetId: number,
): SelectionItem | null => {
  if (!obj || typeof obj !== 'object') return null;

  if (obj._id === targetId || obj.id === targetId) {
    return obj;
  }

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const found = findSelectionInObject(obj[key], targetId);
      if (found) return found;
    }
  }

  return null;
};

/**
 * Загружает подборку по ID
 */
export const fetchCollectionById = async (
  id: string,
  selectionNames: Record<string, string>,
): Promise<{ title: string; tracks: Track[] }> => {
  try {
    const data = await fetchApi<SelectionsResponse>(
      API_ENDPOINTS.ALL_SELECTIONS,
    );

    const title = selectionNames[id] || 'Подборка';

    let trackIds: number[] = [];

    if (data && typeof data === 'object') {
      const targetIdNum = parseInt(id);
      const foundSelection = findSelectionInObject(data, targetIdNum);

      if (
        foundSelection &&
        foundSelection.items &&
        Array.isArray(foundSelection.items)
      ) {
        trackIds = foundSelection.items.map((itemId) => Number(itemId));
      }
    }

    let tracksArray: Track[] = [];
    if (trackIds.length > 0) {
      const allTracks = await fetchAllTracks();
      tracksArray = allTracks.filter((track) => {
        const trackId =
          typeof track._id === 'number' ? track._id : parseInt(track._id);
        return trackIds.includes(trackId);
      });
    }

    return { title, tracks: tracksArray };
  } catch (error) {
    throw error;
  }
};
