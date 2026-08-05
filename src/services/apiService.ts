import { getApiUrl } from '../lib/api';

/**
 * Service Layer for Vibranium AI Network & Proxy API Operations
 * Encapsulates full-stack API calls across Chat, Video, Translator, Weather, and Bulletin.
 */
export const ApiService = {
  /** Resolve API Endpoint URL safely across Vercel, Cloud Run, and Capacitor Native WebViews */
  getUrl: (endpoint: string): string => {
    return getApiUrl(endpoint);
  },

  /** Generic fetch wrapper handling relative & external origins */
  async fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = getApiUrl(endpoint);
    return fetch(url, options);
  }
};
