import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si la sesión expiró y no estamos en login, redirigir
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('hotel_token');
        localStorage.removeItem('hotel_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
