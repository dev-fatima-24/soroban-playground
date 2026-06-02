import prisma from '../db/index.js';
import { ContractInteraction } from '@prisma/client';
import logger from '../utils/logger.js';

export interface CreateInteractionDto {
  studentId?: string;
  contractName: string;
  contractAddress?: string;
  functionName: string;
  parameters?: any;
  network?: string;
}

export interface UpdateInteractionDto {
  result?: any;
  status?: 'pending' | 'success' | 'failed' | 'reverted';
  transactionHash?: string;
  blockNumber?: string;
  gasUsed?: string;
  executionTime?: number;
  errorMessage?: string;
  errorDetails?: any;
}

export interface InteractionFilters {
  studentId?: string;
  contractName?: string;
  status?: string;
  network?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface InteractionStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  averageExecutionTime: number;
  totalGasUsed: bigint;
  contractBreakdown: { contractName: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  dailyInteractions: { date: string; count: number }[];
}

export class ContractInteractionService {
  /**
   * Create a new contract interaction record
   */
  async createInteraction(data: CreateInteractionDto): Promise<ContractInteraction> {
    try {
      const interaction = await prisma.contractInteraction.create({
        data: {
          studentId: data.studentId,
          contractName: data.contractName,
          contractAddress: data.contractAddress,
          functionName: data.functionName,
          parameters: data.parameters || {},
          network: data.network || 'testnet',
          status: 'pending',
        },
      });

      logger.info(`Created contract interaction: ${interaction.id}`, {
        contractName: data.contractName,
        functionName: data.functionName,
      });

      return interaction;
    } catch (error) {
      logger.error('Failed to create contract interaction', error);
      throw error;
    }
  }

  /**
   * Update an existing interaction with results
   */
  async updateInteraction(
    id: string,
    data: UpdateInteractionDto
  ): Promise<ContractInteraction> {
    try {
      const interaction = await prisma.contractInteraction.update({
        where: { id },
        data: {
          ...data,
          result: data.result,
          errorDetails: data.errorDetails,
        },
      });

      logger.info(`Updated contract interaction: ${id}`, {
        status: data.status,
      });

      return interaction;
    } catch (error) {
      logger.error(`Failed to update contract interaction: ${id}`, error);
      throw error;
    }
  }

  /**
   * Get interaction by ID
   */
  async getInteractionById(id: string): Promise<ContractInteraction | null> {
    try {
      return await prisma.contractInteraction.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error(`Failed to get interaction: ${id}`, error);
      throw error;
    }
  }

  /**
   * Get interactions with filters and pagination
   */
  async getInteractions(
    filters: InteractionFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ interactions: ContractInteraction[]; total: number; pages: number }> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters.contractName) {
        where.contractName = { contains: filters.contractName, mode: 'insensitive' };
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.network) {
        where.network = filters.network;
      }

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      if (filters.search) {
        where.OR = [
          { contractName: { contains: filters.search, mode: 'insensitive' } },
          { functionName: { contains: filters.search, mode: 'insensitive' } },
          { transactionHash: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [interactions, total] = await Promise.all([
        prisma.contractInteraction.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
        prisma.contractInteraction.count({ where }),
      ]);

      return {
        interactions,
        total,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Failed to get interactions', error);
      throw error;
    }
  }

  /**
   * Get interaction statistics
   */
  async getInteractionStats(filters: InteractionFilters): Promise<InteractionStats> {
    try {
      const where: any = {};

      if (filters.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters.contractName) {
        where.contractName = { contains: filters.contractName, mode: 'insensitive' };
      }

      if (filters.network) {
        where.network = filters.network;
      }

      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      const [
        total,
        successful,
        failed,
        pending,
        avgExecutionTime,
        contractBreakdown,
        statusBreakdown,
        dailyData,
      ] = await Promise.all([
        prisma.contractInteraction.count({ where }),
        prisma.contractInteraction.count({ where: { ...where, status: 'success' } }),
        prisma.contractInteraction.count({
          where: { ...where, status: { in: ['failed', 'reverted'] } },
        }),
        prisma.contractInteraction.count({ where: { ...where, status: 'pending' } }),
        prisma.contractInteraction.aggregate({
          where: { ...where, executionTime: { not: null } },
          _avg: { executionTime: true },
        }),
        prisma.contractInteraction.groupBy({
          by: ['contractName'],
          where,
          _count: { contractName: true },
          orderBy: { _count: { contractName: 'desc' } },
          take: 10,
        }),
        prisma.contractInteraction.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT DATE(timestamp) as date, COUNT(*)::bigint as count
          FROM contract_interactions
          ${where.timestamp ? `WHERE timestamp >= ${where.timestamp.gte} AND timestamp <= ${where.timestamp.lte}` : ''}
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
          LIMIT 30
        `,
      ]);

      // Calculate total gas used
      const gasData = await prisma.contractInteraction.aggregate({
        where: { ...where, gasUsed: { not: null } },
        _sum: { gasUsed: true },
      });

      const totalGasUsed = BigInt(gasData._sum.gasUsed || 0);

      return {
        total,
        successful,
        failed,
        pending,
        averageExecutionTime: avgExecutionTime._avg.executionTime || 0,
        totalGasUsed,
        contractBreakdown: contractBreakdown.map((item) => ({
          contractName: item.contractName,
          count: item._count.contractName,
        })),
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        dailyInteractions: dailyData.map((item) => ({
          date: item.date.toISOString().split('T')[0],
          count: Number(item.count),
        })),
      };
    } catch (error) {
      logger.error('Failed to get interaction stats', error);
      throw error;
    }
  }

  /**
   * Delete interaction by ID (admin only)
   */
  async deleteInteraction(id: string): Promise<void> {
    try {
      await prisma.contractInteraction.delete({
        where: { id },
      });

      logger.info(`Deleted contract interaction: ${id}`);
    } catch (error) {
      logger.error(`Failed to delete interaction: ${id}`, error);
      throw error;
    }
  }

  /**
   * Export interactions to CSV format
   */
  async exportInteractions(filters: InteractionFilters): Promise<string> {
    try {
      const { interactions } = await this.getInteractions(filters, 1, 10000);

      const headers = [
        'ID',
        'Timestamp',
        'Contract Name',
        'Function',
        'Status',
        'Transaction Hash',
        'Gas Used',
        'Execution Time (ms)',
        'Network',
      ];

      const rows = interactions.map((interaction) => [
        interaction.id,
        interaction.timestamp.toISOString(),
        interaction.contractName,
        interaction.functionName,
        interaction.status,
        interaction.transactionHash || '',
        interaction.gasUsed || '',
        interaction.executionTime?.toString() || '',
        interaction.network,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      return csv;
    } catch (error) {
      logger.error('Failed to export interactions', error);
      throw error;
    }
  }
}

export const contractInteractionService = new ContractInteractionService();
