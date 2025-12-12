import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import prisma from '../utils/db';

export const createGigValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('payment').optional().isFloat({ min: 0 }).withMessage('Payment must be a positive number'),
];

export const createGig = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, venue, date, payment, status } = req.body;
    const userId = req.user!.id;

    const gig = await prisma.gig.create({
      data: {
        title,
        description,
        venue,
        date: new Date(date),
        payment,
        status,
        userId,
      },
    });

    res.status(201).json(gig);
  } catch (error) {
    console.error('Create gig error:', error);
    res.status(500).json({ error: 'Error creating gig' });
  }
};

export const getGigs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, startDate, endDate } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const gigs = await prisma.gig.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json(gigs);
  } catch (error) {
    console.error('Get gigs error:', error);
    res.status(500).json({ error: 'Error fetching gigs' });
  }
};

export const getGig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const gig = await prisma.gig.findFirst({
      where: { id, userId },
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    res.json(gig);
  } catch (error) {
    console.error('Get gig error:', error);
    res.status(500).json({ error: 'Error fetching gig' });
  }
};

export const updateGig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, description, venue, date, payment, status } = req.body;

    const existingGig = await prisma.gig.findFirst({
      where: { id, userId },
    });

    if (!existingGig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const gig = await prisma.gig.update({
      where: { id },
      data: {
        title,
        description,
        venue,
        date: date ? new Date(date) : undefined,
        payment,
        status,
      },
    });

    res.json(gig);
  } catch (error) {
    console.error('Update gig error:', error);
    res.status(500).json({ error: 'Error updating gig' });
  }
};

export const deleteGig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const gig = await prisma.gig.findFirst({
      where: { id, userId },
    });

    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    await prisma.gig.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete gig error:', error);
    res.status(500).json({ error: 'Error deleting gig' });
  }
};
