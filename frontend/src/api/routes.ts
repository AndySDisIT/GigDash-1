import api from './axios';
import { Route } from '../types';

export const routesApi = {
  create: async (data: {
    name: string;
    date: string;
    startLocation?: string;
    endLocation?: string;
    stops: Array<{
      opportunityId: string;
      location: string;
      estimatedTime?: number;
      notes?: string;
    }>;
    notes?: string;
  }): Promise<Route> => {
    const response = await api.post('/routes', data);
    return response.data;
  },

  getAll: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Route[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/routes?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Route> => {
    const response = await api.get(`/routes/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Route> => {
    const response = await api.patch(`/routes/${id}/status`, { status });
    return response.data;
  },

  completeStop: async (stopId: string, notes?: string): Promise<void> => {
    await api.patch(`/routes/stops/${stopId}/complete`, { notes });
  },

  optimize: async (data: {
    opportunityIds: string[];
    startLocation?: string;
  }): Promise<{
    optimized: boolean;
    stops: Array<{
      opportunityId: string;
      location: string;
      order: number;
      estimatedTime: number;
    }>;
    totalStops: number;
    estimatedTotalTime: number;
    message: string;
  }> => {
    const response = await api.post('/routes/optimize', data);
    return response.data;
  },
};
