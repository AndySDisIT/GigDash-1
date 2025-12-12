export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Gig {
  id: string;
  title: string;
  description?: string;
  venue: string;
  date: string;
  payment?: number;
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateGigData {
  title: string;
  description?: string;
  venue: string;
  date: string;
  payment?: number;
  status?: 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
}
