import { Router } from 'express';
import {
  getOpportunities,
  getOpportunitiesValidation,
  getOpportunity,
  applyToOpportunity,
  getMyApplications,
  updateApplicationStatus,
} from '../controllers/opportunityController';
import { authenticate } from '../middleware/auth';
import { gigLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(gigLimiter);

router.get('/', getOpportunitiesValidation, getOpportunities);
router.get('/applications', getMyApplications);
router.get('/:id', getOpportunity);
router.post('/:id/apply', applyToOpportunity);
router.patch('/applications/:id', updateApplicationStatus);

export default router;
