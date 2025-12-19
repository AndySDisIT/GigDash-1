import api from './axios';
import { Gig, CreateGigData } from '../types';

export const gigsApi = {
  getAll: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Gig[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/gigs?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Gig> => {
    const response = await api.get(`/gigs/${id}`);
    return response.data;
  },

  create: async (data: CreateGigData): Promise<Gig> => {
    const response = await api.post('/gigs', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateGigData>): Promise<Gig> => {
    const response = await api.put(`/gigs/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/gigs/${id}`);
  },
};
