import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import gigRoutes from './routes/gigRoutes';
import opportunityRoutes from './routes/opportunityRoutes';
import platformRoutes from './routes/platformRoutes';
import paymentRoutes from './routes/paymentRoutes';
import routeRoutes from './routes/routeRoutes';
import healthRoutes from './routes/healthRoutes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(compression()); // Add compression for responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);

// Health check routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/routes', routeRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
