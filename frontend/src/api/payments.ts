import api from './axios';
import { Payment } from '../types';

export const paymentsApi = {
  create: async (data: {
    applicationId: string;
    amount: number;
    expectedDate?: string;
    paymentMethod?: string;
    notes?: string;
  }): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  getAll: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Payment[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/payments?${params.toString()}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    data: { status?: string; paidDate?: string; notes?: string }
  ): Promise<Payment> => {
    const response = await api.patch(`/payments/${id}`, data);
    return response.data;
  },

  getStats: async (): Promise<{
    totalPending: number;
    totalPaid: number;
    totalProcessing: number;
    total: number;
  }> => {
    const response = await api.get('/payments/stats');
    return response.data;
  },
};
