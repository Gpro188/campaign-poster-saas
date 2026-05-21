import axios from 'axios';
import { Campaign, Poster, CampaignStats } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin_token='))
        ?.split('=')[1];
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Campaign APIs
export const campaignAPI = {
  getAdminAll: async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns/admin/all');
    return response.data.campaigns;
  },
  create: async (formData: FormData): Promise<Campaign> => {
    const response = await api.post('/campaigns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.campaign;
  },

  getAll: async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns');
    return response.data.campaigns;
  },

  getById: async (id: string): Promise<Campaign> => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data.campaign;
  },

  update: async (id: string, formData: FormData): Promise<Campaign> => {
    const response = await api.put(`/campaigns/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.campaign;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
  },

  getStats: async (id: string): Promise<CampaignStats> => {
    const response = await api.get(`/campaigns/${id}/stats`);
    return response.data;
  },
};

// Poster APIs
export const posterAPI = {
  create: async (formData: FormData): Promise<Poster> => {
    const response = await api.post('/posters', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.poster;
  },

  getByCampaign: async (campaignId: string, limit = 20, skip = 0): Promise<{ posters: Poster[]; total: number }> => {
    const response = await api.get(`/posters/campaign/${campaignId}`, {
      params: { limit, skip },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Poster> => {
    const response = await api.get(`/posters/${id}`);
    return response.data.poster;
  },

  getAll: async (limit = 50, skip = 0): Promise<{ posters: Poster[]; total: number }> => {
    const response = await api.get('/posters', {
      params: { limit, skip },
    });
    return response.data;
  },

  incrementShare: async (id: string): Promise<Poster> => {
    const response = await api.post(`/posters/${id}/share`);
    return response.data.poster;
  },
};

// Auth APIs
export const authAPI = {
  login: async (username: string, password: string): Promise<{ token: string; admin: { id: string; username: string } }> => {
    const response = await api.post('/admin/login', { username, password });
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/admin/change-password', { oldPassword, newPassword });
    return response.data;
  },
};
