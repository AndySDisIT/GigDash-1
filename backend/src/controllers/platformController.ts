import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import prisma from '../utils/db';

export const getPlatforms = async (req: AuthRequest, res: Response) => {
  try {
    const { category } = req.query;

    interface WhereClause {
      active: boolean;
      category?: string;
    }

    const where: WhereClause = { active: true };

    if (category && typeof category === 'string') {
      where.category = category;
    }

    const platforms = await prisma.platform.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(platforms);
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Error fetching platforms' });
  }
};

export const getPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const platform = await prisma.platform.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            opportunities: true,
            accounts: true,
          },
        },
      },
    });

    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    res.json(platform);
  } catch (error) {
    console.error('Get platform error:', error);
    res.status(500).json({ error: 'Error fetching platform' });
  }
};

export const connectPlatformValidation = [
  body('platformId').isUUID().withMessage('Valid platform ID is required'),
  body('username').optional().isString(),
];

export const connectPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { platformId, username, metadata } = req.body;

    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
    });

    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    const existingAccount = await prisma.userPlatformAccount.findUnique({
      where: {
        userId_platformId: {
          userId,
          platformId,
        },
      },
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Platform already connected' });
    }

    const account = await prisma.userPlatformAccount.create({
      data: {
        userId,
        platformId,
        username,
        status: 'CONNECTED',
        connectedAt: new Date(),
        metadata,
      },
      include: {
        platform: true,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Connect platform error:', error);
    res.status(500).json({ error: 'Error connecting platform' });
  }
};

export const getMyPlatforms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const accounts = await prisma.userPlatformAccount.findMany({
      where: { userId },
      include: {
        platform: true,
      },
      orderBy: { connectedAt: 'desc' },
    });

    res.json(accounts);
  } catch (error) {
    console.error('Get my platforms error:', error);
    res.status(500).json({ error: 'Error fetching connected platforms' });
  }
};

export const disconnectPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const account = await prisma.userPlatformAccount.findFirst({
      where: { id, userId },
    });

    if (!account) {
      return res.status(404).json({ error: 'Platform connection not found' });
    }

    await prisma.userPlatformAccount.update({
      where: { id },
      data: {
        status: 'DISCONNECTED',
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Disconnect platform error:', error);
    res.status(500).json({ error: 'Error disconnecting platform' });
  }
};
