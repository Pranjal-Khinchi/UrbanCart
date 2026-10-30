import axios from 'axios';

// Centralized API base URL. Never hard-code backend URLs in components —
// always import `api` from here. In production, VITE_API_URL must point
// at the deployed backend, never localhost.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('urbancart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('urbancart_token');
      localStorage.removeItem('urbancart_user');
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  return error?.response?.data?.message || 'Something went wrong. Please try again.';
}

export default api;
