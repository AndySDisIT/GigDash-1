import { Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import prisma from '../utils/db';

export const getOpportunitiesValidation = [
  query('category').optional().isString(),
  query('location').optional().isString(),
  query('minPay').optional().isFloat({ min: 0 }),
  query('maxPay').optional().isFloat({ min: 0 }),
  query('effortLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
  query('platformId').optional().isUUID(),
];

export const getOpportunities = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, location, minPay, maxPay, effortLevel, platformId } = req.query;

    interface WhereClause {
      status: string;
      category?: string;
      location?: { contains: string; mode: 'insensitive' };
      payRate?: { gte?: number; lte?: number };
      effortLevel?: string;
      platformId?: string;
    }

    const where: WhereClause = {
      status: 'AVAILABLE',
    };

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (location && typeof location === 'string') {
      where.location = { contains: location, mode: 'insensitive' as any };
    }

    if (minPay || maxPay) {
      where.payRate = {};
      if (minPay && typeof minPay === 'string') {
        where.payRate.gte = parseFloat(minPay);
      }
      if (maxPay && typeof maxPay === 'string') {
        where.payRate.lte = parseFloat(maxPay);
      }
    }

    if (effortLevel && typeof effortLevel === 'string') {
      where.effortLevel = effortLevel;
    }

    if (platformId && typeof platformId === 'string') {
      where.platformId = platformId;
    }

    const opportunities = await prisma.jobOpportunity.findMany({
      where,
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [
        { postedAt: 'desc' },
      ],
    });

    res.json(opportunities);
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Error fetching opportunities' });
  }
};

export const getOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const opportunity = await prisma.jobOpportunity.findUnique({
      where: { id },
      include: {
        platform: true,
        applications: {
          where: {
            userId: req.user!.id,
          },
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Error fetching opportunity' });
  }
};

export const applyToOpportunity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { notes } = req.body;

    const opportunity = await prisma.jobOpportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (opportunity.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Opportunity is no longer available' });
    }

    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        userId_opportunityId: {
          userId,
          opportunityId: id,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this opportunity' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        userId,
        opportunityId: id,
        notes,
      },
      include: {
        opportunity: {
          include: {
            platform: true,
          },
        },
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply to opportunity error:', error);
    res.status(500).json({ error: 'Error applying to opportunity' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    interface WhereClause {
      userId: string;
      status?: string;
    }

    const where: WhereClause = { userId };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        opportunity: {
          include: {
            platform: true,
          },
        },
        payment: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Error fetching applications' });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status, notes } = req.body;

    const application = await prisma.jobApplication.findFirst({
      where: { id, userId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updateData: {
      status?: string;
      notes?: string;
      completedAt?: Date;
    } = {};

    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (status === 'COMPLETED' && !application.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
      include: {
        opportunity: {
          include: {
            platform: true,
          },
        },
        payment: true,
      },
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Error updating application' });
  }
};
