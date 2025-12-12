export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  location?: string;
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

export interface Platform {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  logoUrl?: string;
  signupUrl?: string;
  apiEnabled: boolean;
  active: boolean;
}

export interface UserPlatformAccount {
  id: string;
  userId: string;
  platformId: string;
  username?: string;
  status: 'PENDING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  connectedAt?: string;
  platform: Platform;
}

export interface JobOpportunity {
  id: string;
  platformId: string;
  externalId?: string;
  title: string;
  description?: string;
  category: string;
  location?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  payRate?: number;
  payType?: string;
  effortLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  duration?: string;
  requirements?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  postedAt: string;
  platform: Platform;
}

export interface JobApplication {
  id: string;
  userId: string;
  opportunityId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  appliedAt: string;
  completedAt?: string;
  notes?: string;
  opportunity: JobOpportunity;
  payment?: Payment;
}

export interface Payment {
  id: string;
  applicationId: string;
  userId: string;
  platformId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  expectedDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface Route {
  id: string;
  userId: string;
  name: string;
  date: string;
  startLocation?: string;
  endLocation?: string;
  totalDistance?: number;
  estimatedTime?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  stops: RouteStop[];
}

export interface RouteStop {
  id: string;
  routeId: string;
  opportunityId: string;
  order: number;
  location: string;
  estimatedTime?: number;
  completed: boolean;
  completedAt?: string;
}
