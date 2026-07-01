import axios from 'axios';
import Cookies from 'js-cookie';
import { API_URL } from './env';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const skipAuth = config.url?.includes('auth/login') || config.url?.includes('auth/signup');
  if (!skipAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.includes('auth/login');
    if (error.response?.status === 401 && !isLoginAttempt && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
