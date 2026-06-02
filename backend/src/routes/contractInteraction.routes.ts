import { Router } from 'express';
import { contractInteractionController } from '../controllers/contractInteraction.controller.js';

const router = Router();

/**
 * Contract Interaction Routes
 *
 * Endpoints:
 * - GET /api/contract-interactions/stats          Get interaction statistics
 * - GET /api/contract-interactions/export         Export interactions to CSV
 * - GET /api/contract-interactions/:id            Get interaction by ID
 * - GET /api/contract-interactions                Get all interactions (with filters)
 * - POST /api/contract-interactions               Create new interaction
 * - PUT /api/contract-interactions/:id            Update interaction
 * - DELETE /api/contract-interactions/:id         Delete interaction
 */

// Stats endpoint (must be before :id route)
router.get('/stats', contractInteractionController.getStats.bind(contractInteractionController));

// Export endpoint (must be before :id route)
router.get(
  '/export',
  contractInteractionController.exportInteractions.bind(contractInteractionController)
);

// Get interaction by ID
router.get(
  '/:id',
  contractInteractionController.getInteractionById.bind(contractInteractionController)
);

// Get all interactions with filters
router.get('/', contractInteractionController.getInteractions.bind(contractInteractionController));

// Create new interaction
router.post(
  '/',
  contractInteractionController.createInteraction.bind(contractInteractionController)
);

// Update interaction
router.put(
  '/:id',
  contractInteractionController.updateInteraction.bind(contractInteractionController)
);

// Delete interaction
router.delete(
  '/:id',
  contractInteractionController.deleteInteraction.bind(contractInteractionController)
);

export default router;
