import api from './axios';
import { JobOpportunity, JobApplication } from '../types';

export const opportunitiesApi = {
  getAll: async (filters?: {
    category?: string;
    location?: string;
    minPay?: number;
    maxPay?: number;
    effortLevel?: string;
    platformId?: string;
  }): Promise<JobOpportunity[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.minPay) params.append('minPay', filters.minPay.toString());
    if (filters?.maxPay) params.append('maxPay', filters.maxPay.toString());
    if (filters?.effortLevel) params.append('effortLevel', filters.effortLevel);
    if (filters?.platformId) params.append('platformId', filters.platformId);
    
    const response = await api.get(`/opportunities?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<JobOpportunity> => {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
  },

  apply: async (id: string, notes?: string): Promise<JobApplication> => {
    const response = await api.post(`/opportunities/${id}/apply`, { notes });
    return response.data;
  },

  getMyApplications: async (status?: string): Promise<JobApplication[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/opportunities/applications${params}`);
    return response.data;
  },

  updateApplication: async (
    id: string,
    data: { status?: string; notes?: string }
  ): Promise<JobApplication> => {
    const response = await api.patch(`/opportunities/applications/${id}`, data);
    return response.data;
  },
};
