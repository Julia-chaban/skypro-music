export const API_BASE_URL = 'https://webdev-music-003b5b991590.herokuapp.com';

export const fixTrackUrl = (trackFile: string | unknown): string => {
  if (typeof trackFile !== 'string') {
    return '';
  }

  let trackUrl = trackFile.trim();

  if (
    trackUrl.startsWith('http://') ||
    trackUrl.startsWith('https://') ||
    trackUrl.startsWith('/') ||
    trackUrl.startsWith('blob:')
  ) {
    return trackUrl;
  }

  if (trackUrl) {
    trackUrl = trackUrl.replace(/^\/+/, '');

    if (trackUrl.startsWith('media/')) {
      return `${API_BASE_URL}/${trackUrl}`;
    } else {
      return `${API_BASE_URL}/media/${trackUrl}`;
    }
  }

  return '';
};
