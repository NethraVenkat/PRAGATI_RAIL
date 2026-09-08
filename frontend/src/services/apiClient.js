import axios from 'axios';
import { mockAdapter } from '../mock/mockAdapter';

// Get API Base URL from Vite env variables or Settings configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ----------------------------------------------------------------------------
// Dual-Mode Transparent Interceptor
// ----------------------------------------------------------------------------
// By default (VITE_USE_MOCK !== 'false') every request from this client is
// answered by the in-browser mock backend (src/mock/mockAdapter.js), which is
// backed by localStorage and simulates the real Node/Express + ML pipeline.
// This means `npm install && npm run dev` inside frontend/ alone is a fully
// working, self-contained demo -- no backend, database, or Python required.
//
// Flip VITE_USE_MOCK=false in .env once the real backend is reachable and
// this client will make normal network calls to API_BASE_URL instead.
// ----------------------------------------------------------------------------
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000,
  adapter: USE_MOCK ? mockAdapter : undefined
});

// Interceptor to attach Bearer Authorization token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Safety net: if mock mode is off and the real backend is unreachable, fail
// soft (log only) instead of surfacing raw Axios network errors everywhere.
if (!USE_MOCK) {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      console.warn('[apiClient] Live backend request failed:', error?.message);
      return Promise.reject(error);
    }
  );
}
