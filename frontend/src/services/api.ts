import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

export const authApi = {
  login: (data: LoginData) => api.post('/auth/login', data),
  register: (data: RegisterData) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const coursesApi = {
  getAll: () => api.get('/courses'),
  getById: (id: string) => api.get(`/courses/${id}`),
  create: (data: FormData) => api.post('/courses', data),
  update: (id: string, data: FormData) => api.put(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
  complete: (id: string) => api.post(`/courses/${id}/complete`),
};

export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: FormData) => api.put('/users/profile', data),
};

export default api;