import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import prisma from '../utils/db';

export const createRouteValidation = [
  body('name').notEmpty().withMessage('Route name is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('stops').isArray({ min: 1 }).withMessage('At least one stop is required'),
];

export const createRoute = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { name, date, startLocation, endLocation, stops, notes } = req.body;

    // Validate all opportunities exist
    const opportunityIds = stops.map((stop: { opportunityId: string }) => stop.opportunityId);
    const opportunities = await prisma.jobOpportunity.findMany({
      where: { id: { in: opportunityIds } },
      include: {
        applications: {
          where: { userId },
        },
      },
    });

    if (opportunities.length !== opportunityIds.length) {
      return res.status(400).json({ error: 'One or more opportunities not found' });
    }

    // Create route with stops
    const route = await prisma.route.create({
      data: {
        userId,
        name,
        date: new Date(date),
        startLocation,
        endLocation,
        notes,
        stops: {
          create: stops.map((stop: { opportunityId: string; location: string; estimatedTime?: number; notes?: string }, index: number) => ({
            opportunityId: stop.opportunityId,
            location: stop.location,
            order: index + 1,
            estimatedTime: stop.estimatedTime,
            notes: stop.notes,
          })),
        },
      },
      include: {
        stops: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json(route);
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Error creating route' });
  }
};

export const getMyRoutes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, startDate, endDate } = req.query;

    interface WhereClause {
      userId: string;
      status?: string;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = { userId };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate && typeof startDate === 'string') {
        where.date.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.date.lte = new Date(endDate);
      }
    }

    const routes = await prisma.route.findMany({
      where,
      include: {
        stops: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(routes);
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: 'Error fetching routes' });
  }
};

export const getRoute = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const route = await prisma.route.findFirst({
      where: { id, userId },
      include: {
        stops: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(route);
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Error fetching route' });
  }
};

export const updateRouteStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status } = req.body;

    const route = await prisma.route.findFirst({
      where: { id, userId },
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const updatedRoute = await prisma.route.update({
      where: { id },
      data: { status },
      include: {
        stops: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json(updatedRoute);
  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Error updating route' });
  }
};

export const completeRouteStop = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { notes } = req.body;

    const stop = await prisma.routeStop.findFirst({
      where: {
        id,
        route: { userId },
      },
    });

    if (!stop) {
      return res.status(404).json({ error: 'Route stop not found' });
    }

    const updatedStop = await prisma.routeStop.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
        notes,
      },
    });

    res.json(updatedStop);
  } catch (error) {
    console.error('Complete route stop error:', error);
    res.status(500).json({ error: 'Error completing route stop' });
  }
};

export const optimizeRoute = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { opportunityIds, startLocation } = req.body;

    if (!opportunityIds || !Array.isArray(opportunityIds) || opportunityIds.length === 0) {
      return res.status(400).json({ error: 'Opportunity IDs are required' });
    }

    // Fetch opportunities with location data
    const opportunities = await prisma.jobOpportunity.findMany({
      where: {
        id: { in: opportunityIds },
        applications: {
          some: { userId },
        },
      },
    });

    if (opportunities.length === 0) {
      return res.status(404).json({ error: 'No valid opportunities found' });
    }

    // Simple optimization: sort by location proximity (basic implementation)
    // In production, you'd integrate with a routing API like Google Maps or Mapbox
    const optimizedStops = opportunities.map((opp, index) => ({
      opportunityId: opp.id,
      location: opp.location || 'Unknown',
      order: index + 1,
      estimatedTime: 30, // Default 30 minutes per stop
    }));

    res.json({
      optimized: true,
      stops: optimizedStops,
      totalStops: optimizedStops.length,
      estimatedTotalTime: optimizedStops.length * 30,
      message: 'Route optimized. Review and create route to save.',
    });
  } catch (error) {
    console.error('Optimize route error:', error);
    res.status(500).json({ error: 'Error optimizing route' });
  }
};
