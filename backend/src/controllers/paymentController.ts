import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import prisma from '../utils/db';

export const createPaymentValidation = [
  body('applicationId').isUUID().withMessage('Valid application ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('expectedDate').optional().isISO8601(),
];

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.id;
    const { applicationId, amount, expectedDate, paymentMethod, notes } = req.body;

    const application = await prisma.jobApplication.findFirst({
      where: { id: applicationId, userId },
      include: { opportunity: true },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const payment = await prisma.payment.create({
      data: {
        applicationId,
        userId,
        platformId: application.opportunity.platformId,
        amount,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        paymentMethod,
        notes,
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Error creating payment' });
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, startDate, endDate } = req.query;

    interface WhereClause {
      userId: string;
      status?: string;
      expectedDate?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = { userId };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.expectedDate = {};
      if (startDate && typeof startDate === 'string') {
        where.expectedDate.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.expectedDate.lte = new Date(endDate);
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        application: {
          include: {
            opportunity: {
              include: {
                platform: true,
              },
            },
          },
        },
      },
      orderBy: { expectedDate: 'asc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Error fetching payments' });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status, paidDate, notes } = req.body;

    const payment = await prisma.payment.findFirst({
      where: { id, userId },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const updateData: {
      status?: string;
      paidDate?: Date;
      notes?: string;
    } = {};

    if (status) updateData.status = status;
    if (paidDate) updateData.paidDate = new Date(paidDate);
    if (notes !== undefined) updateData.notes = notes;

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedPayment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Error updating payment' });
  }
};

export const getPaymentStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const stats = await prisma.payment.groupBy({
      by: ['status'],
      where: { userId },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const totalPending = stats.find((s) => s.status === 'PENDING')?._sum.amount || 0;
    const totalPaid = stats.find((s) => s.status === 'PAID')?._sum.amount || 0;
    const totalProcessing = stats.find((s) => s.status === 'PROCESSING')?._sum.amount || 0;

    res.json({
      totalPending,
      totalPaid,
      totalProcessing,
      total: totalPending + totalPaid + totalProcessing,
      breakdown: stats,
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Error fetching payment stats' });
  }
};
