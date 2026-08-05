/**
 * Client-side API Abstraction Layer
 * Provides clean methods to call Vibranium AI backend endpoints.
 */
import { ApiService } from '../services/apiService';

export const ApiClient = {
  getApiUrl: ApiService.getUrl,
  fetchApi: ApiService.fetchApi
};
