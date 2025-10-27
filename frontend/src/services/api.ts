import axios from 'axios';
import { Course, User } from '../types';

/// <reference types="vite/client" />

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Configurar el interceptor para usar el token del localStorage directamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
  login: (data: LoginData) => api.post<{ token: string; user: User }>('/api/auth/login', data),
  register: (data: RegisterData) => api.post<{ token: string; user: User }>('/api/auth/register', data),
  me: () => api.get<User>('/api/auth/me'),
};

export const coursesApi = {
  getAll: () => api.get<Course[]>('/api/courses'),
  getById: (id: string) => api.get<Course>(`/api/courses/${id}`),
  create: (data: FormData) => api.post<Course>('/api/courses', data),
  // Add chapter with files (expects multipart/form-data with fields title, description and files[])
  addChapter: (id: string, data: FormData) => api.post<Course>(`/api/courses/${id}/chapters`, data),
  update: (id: string, data: FormData) => api.put<Course>(`/api/courses/${id}`, data),
  delete: (id: string) => api.delete(`/api/courses/${id}`),
  deleteChapter: (courseId: string, chapterId: string) => api.delete(`/api/courses/${courseId}/chapters/${chapterId}`),
  complete: (id: string) => api.post<{ message: string }>(`/api/courses/${id}/complete`),
  completeChapter: (courseId: string, chapterId: string) => 
    api.post<{ message: string }>(`/api/courses/${courseId}/chapters/${chapterId}/complete`),
};

export const usersApi = {
  getProfile: () => api.get<User>('/api/users/profile'),
  updateProfile: (data: FormData) => api.put<User>('/api/users/profile', data),
};

export default api;