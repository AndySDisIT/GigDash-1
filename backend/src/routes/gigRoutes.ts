import { Router } from 'express';
import {
  createGig,
  createGigValidation,
  getGigs,
  getGig,
  updateGig,
  deleteGig,
} from '../controllers/gigController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createGigValidation, createGig);
router.get('/', getGigs);
router.get('/:id', getGig);
router.put('/:id', updateGig);
router.delete('/:id', deleteGig);

export default router;
