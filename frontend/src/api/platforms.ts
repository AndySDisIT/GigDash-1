import api from './axios';
import { Platform, UserPlatformAccount } from '../types';

export const platformsApi = {
  getAll: async (category?: string): Promise<Platform[]> => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/platforms${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<Platform> => {
    const response = await api.get(`/platforms/${id}`);
    return response.data;
  },

  getMyPlatforms: async (): Promise<UserPlatformAccount[]> => {
    const response = await api.get('/platforms/my');
    return response.data;
  },

  connect: async (data: {
    platformId: string;
    username?: string;
    metadata?: any;
  }): Promise<UserPlatformAccount> => {
    const response = await api.post('/platforms/connect', data);
    return response.data;
  },

  disconnect: async (id: string): Promise<void> => {
    await api.delete(`/platforms/disconnect/${id}`);
  },
};
