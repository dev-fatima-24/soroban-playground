import { Request, Response } from 'express';
import { contractInteractionService } from '../services/contractInteraction.service.js';
import logger from '../utils/logger.js';

export class ContractInteractionController {
  /**
   * Create a new contract interaction
   * POST /api/contract-interactions
   */
  async createInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, contractName, contractAddress, functionName, parameters, network } =
        req.body;

      if (!contractName || !functionName) {
        res.status(400).json({
          error: 'Contract name and function name are required',
        });
        return;
      }

      const interaction = await contractInteractionService.createInteraction({
        studentId,
        contractName,
        contractAddress,
        functionName,
        parameters,
        network,
      });

      res.status(201).json(interaction);
    } catch (error) {
      logger.error('Error creating contract interaction', error);
      res.status(500).json({ error: 'Failed to create contract interaction' });
    }
  }

  /**
   * Update contract interaction with results
   * PUT /api/contract-interactions/:id
   */
  async updateInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const interaction = await contractInteractionService.updateInteraction(id, updateData);

      res.json(interaction);
    } catch (error) {
      logger.error('Error updating contract interaction', error);
      res.status(500).json({ error: 'Failed to update contract interaction' });
    }
  }

  /**
   * Get interaction by ID
   * GET /api/contract-interactions/:id
   */
  async getInteractionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const interaction = await contractInteractionService.getInteractionById(id);

      if (!interaction) {
        res.status(404).json({ error: 'Interaction not found' });
        return;
      }

      res.json(interaction);
    } catch (error) {
      logger.error('Error getting contract interaction', error);
      res.status(500).json({ error: 'Failed to get contract interaction' });
    }
  }

  /**
   * Get interactions with filters and pagination
   * GET /api/contract-interactions
   */
  async getInteractions(req: Request, res: Response): Promise<void> {
    try {
      const {
        studentId,
        contractName,
        status,
        network,
        startDate,
        endDate,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      const filters: any = {};

      if (studentId) filters.studentId = studentId as string;
      if (contractName) filters.contractName = contractName as string;
      if (status) filters.status = status as string;
      if (network) filters.network = network as string;
      if (search) filters.search = search as string;

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const result = await contractInteractionService.getInteractions(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(result);
    } catch (error) {
      logger.error('Error getting contract interactions', error);
      res.status(500).json({ error: 'Failed to get contract interactions' });
    }
  }

  /**
   * Get interaction statistics
   * GET /api/contract-interactions/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, contractName, network, startDate, endDate } = req.query;

      const filters: any = {};

      if (studentId) filters.studentId = studentId as string;
      if (contractName) filters.contractName = contractName as string;
      if (network) filters.network = network as string;

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const stats = await contractInteractionService.getInteractionStats(filters);

      res.json(stats);
    } catch (error) {
      logger.error('Error getting interaction stats', error);
      res.status(500).json({ error: 'Failed to get interaction statistics' });
    }
  }

  /**
   * Export interactions to CSV
   * GET /api/contract-interactions/export
   */
  async exportInteractions(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, contractName, status, network, startDate, endDate, search } = req.query;

      const filters: any = {};

      if (studentId) filters.studentId = studentId as string;
      if (contractName) filters.contractName = contractName as string;
      if (status) filters.status = status as string;
      if (network) filters.network = network as string;
      if (search) filters.search = search as string;

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const csv = await contractInteractionService.exportInteractions(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="contract-interactions-${Date.now()}.csv"`
      );
      res.send(csv);
    } catch (error) {
      logger.error('Error exporting contract interactions', error);
      res.status(500).json({ error: 'Failed to export contract interactions' });
    }
  }

  /**
   * Delete interaction by ID
   * DELETE /api/contract-interactions/:id
   */
  async deleteInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await contractInteractionService.deleteInteraction(id);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting contract interaction', error);
      res.status(500).json({ error: 'Failed to delete contract interaction' });
    }
  }
}

export const contractInteractionController = new ContractInteractionController();
