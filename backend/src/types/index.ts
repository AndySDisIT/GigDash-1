import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}
