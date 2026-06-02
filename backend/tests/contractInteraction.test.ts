import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { contractInteractionService } from '../src/services/contractInteraction.service';
import prisma from '../src/db/index';

describe('ContractInteractionService', () => {
  const testStudentId = 'test-student-123';
  const createdInteractionIds: string[] = [];

  afterEach(async () => {
    // Clean up created interactions
    if (createdInteractionIds.length > 0) {
      await prisma.contractInteraction.deleteMany({
        where: {
          id: {
            in: createdInteractionIds,
          },
        },
      });
      createdInteractionIds.length = 0;
    }
  });

  describe('createInteraction', () => {
    it('should create a new contract interaction', async () => {
      const interaction = await contractInteractionService.createInteraction({
        studentId: testStudentId,
        contractName: 'TestContract',
        functionName: 'testFunction',
        parameters: { arg1: 'value1' },
        network: 'testnet',
      });

      expect(interaction).toBeDefined();
      expect(interaction.id).toBeDefined();
      expect(interaction.contractName).toBe('TestContract');
      expect(interaction.functionName).toBe('testFunction');
      expect(interaction.status).toBe('pending');

      createdInteractionIds.push(interaction.id);
    });

    it('should create interaction without studentId', async () => {
      const interaction = await contractInteractionService.createInteraction({
        contractName: 'AnonymousContract',
        functionName: 'anonymousFunction',
        network: 'testnet',
      });

      expect(interaction).toBeDefined();
      expect(interaction.studentId).toBeNull();

      createdInteractionIds.push(interaction.id);
    });
  });

  describe('updateInteraction', () => {
    it('should update interaction with success result', async () => {
      const interaction = await contractInteractionService.createInteraction({
        studentId: testStudentId,
        contractName: 'TestContract',
        functionName: 'testFunction',
      });

      createdInteractionIds.push(interaction.id);

      const updated = await contractInteractionService.updateInteraction(interaction.id, {
        status: 'success',
        result: { output: 'success' },
        executionTime: 150,
        gasUsed: '21000',
        transactionHash: '0x123abc',
      });

      expect(updated.status).toBe('success');
      expect(updated.executionTime).toBe(150);
      expect(updated.gasUsed).toBe('21000');
      expect(updated.transactionHash).toBe('0x123abc');
    });

    it('should update interaction with failure', async () => {
      const interaction = await contractInteractionService.createInteraction({
        studentId: testStudentId,
        contractName: 'TestContract',
        functionName: 'failingFunction',
      });

      createdInteractionIds.push(interaction.id);

      const updated = await contractInteractionService.updateInteraction(interaction.id, {
        status: 'failed',
        errorMessage: 'Contract execution failed',
        executionTime: 100,
      });

      expect(updated.status).toBe('failed');
      expect(updated.errorMessage).toBe('Contract execution failed');
    });
  });

  describe('getInteractionById', () => {
    it('should retrieve interaction by ID', async () => {
      const interaction = await contractInteractionService.createInteraction({
        studentId: testStudentId,
        contractName: 'TestContract',
        functionName: 'testFunction',
      });

      createdInteractionIds.push(interaction.id);

      const retrieved = await contractInteractionService.getInteractionById(interaction.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(interaction.id);
      expect(retrieved?.contractName).toBe('TestContract');
    });

    it('should return null for non-existent ID', async () => {
      const retrieved = await contractInteractionService.getInteractionById('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getInteractions', () => {
    beforeEach(async () => {
      // Create test interactions
      const interactions = await Promise.all([
        contractInteractionService.createInteraction({
          studentId: testStudentId,
          contractName: 'Contract1',
          functionName: 'function1',
          network: 'testnet',
        }),
        contractInteractionService.createInteraction({
          studentId: testStudentId,
          contractName: 'Contract2',
          functionName: 'function2',
          network: 'testnet',
        }),
        contractInteractionService.createInteraction({
          studentId: 'other-student',
          contractName: 'Contract3',
          functionName: 'function3',
          network: 'mainnet',
        }),
      ]);

      interactions.forEach((i) => createdInteractionIds.push(i.id));

      // Update one to success
      await contractInteractionService.updateInteraction(interactions[0].id, {
        status: 'success',
      });
    });

    it('should get all interactions with pagination', async () => {
      const result = await contractInteractionService.getInteractions({}, 1, 10);

      expect(result.interactions).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.pages).toBeGreaterThanOrEqual(1);
    });

    it('should filter by studentId', async () => {
      const result = await contractInteractionService.getInteractions(
        { studentId: testStudentId },
        1,
        10
      );

      expect(result.interactions.length).toBeGreaterThanOrEqual(2);
      result.interactions.forEach((i) => {
        expect(i.studentId).toBe(testStudentId);
      });
    });

    it('should filter by status', async () => {
      const result = await contractInteractionService.getInteractions({ status: 'success' }, 1, 10);

      expect(result.interactions.length).toBeGreaterThanOrEqual(1);
      result.interactions.forEach((i) => {
        expect(i.status).toBe('success');
      });
    });

    it('should filter by network', async () => {
      const result = await contractInteractionService.getInteractions({ network: 'testnet' }, 1, 10);

      expect(result.interactions.length).toBeGreaterThanOrEqual(2);
      result.interactions.forEach((i) => {
        expect(i.network).toBe('testnet');
      });
    });

    it('should search by contract name', async () => {
      const result = await contractInteractionService.getInteractions({ search: 'Contract1' }, 1, 10);

      expect(result.interactions.length).toBeGreaterThanOrEqual(1);
      expect(result.interactions[0].contractName).toContain('Contract1');
    });
  });

  describe('getInteractionStats', () => {
    beforeEach(async () => {
      // Create test interactions with different statuses
      const interactions = await Promise.all([
        contractInteractionService.createInteraction({
          studentId: testStudentId,
          contractName: 'StatsContract1',
          functionName: 'function1',
        }),
        contractInteractionService.createInteraction({
          studentId: testStudentId,
          contractName: 'StatsContract2',
          functionName: 'function2',
        }),
        contractInteractionService.createInteraction({
          studentId: testStudentId,
          contractName: 'StatsContract3',
          functionName: 'function3',
        }),
      ]);

      interactions.forEach((i) => createdInteractionIds.push(i.id));

      // Update with different statuses and metrics
      await contractInteractionService.updateInteraction(interactions[0].id, {
        status: 'success',
        executionTime: 100,
        gasUsed: '21000',
      });

      await contractInteractionService.updateInteraction(interactions[1].id, {
        status: 'success',
        executionTime: 200,
        gasUsed: '42000',
      });

      await contractInteractionService.updateInteraction(interactions[2].id, {
        status: 'failed',
        executionTime: 50,
      });
    });

    it('should calculate interaction statistics', async () => {
      const stats = await contractInteractionService.getInteractionStats({
        studentId: testStudentId,
      });

      expect(stats.total).toBeGreaterThanOrEqual(3);
      expect(stats.successful).toBeGreaterThanOrEqual(2);
      expect(stats.failed).toBeGreaterThanOrEqual(1);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });

    it('should provide contract breakdown', async () => {
      const stats = await contractInteractionService.getInteractionStats({
        studentId: testStudentId,
      });

      expect(stats.contractBreakdown).toBeDefined();
      expect(stats.contractBreakdown.length).toBeGreaterThan(0);
      expect(stats.contractBreakdown[0]).toHaveProperty('contractName');
      expect(stats.contractBreakdown[0]).toHaveProperty('count');
    });

    it('should provide status breakdown', async () => {
      const stats = await contractInteractionService.getInteractionStats({
        studentId: testStudentId,
      });

      expect(stats.statusBreakdown).toBeDefined();
      expect(stats.statusBreakdown.length).toBeGreaterThan(0);

      const successStatus = stats.statusBreakdown.find((s) => s.status === 'success');
      expect(successStatus).toBeDefined();
      expect(successStatus!.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('exportInteractions', () => {
    beforeEach(async () => {
      const interaction = await contractInteractionService.createInteraction({
        studentId: testStudentId,
        contractName: 'ExportContract',
        functionName: 'exportFunction',
      });

      createdInteractionIds.push(interaction.id);
    });

    it('should export interactions as CSV', async () => {
      const csv = await contractInteractionService.exportInteractions({
        studentId: testStudentId,
      });

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('ID,Timestamp,Contract Name,Function,Status');
      expect(csv).toContain('ExportContract');
    });
  });

  describe('deleteInteraction', () => {
    it('should delete interaction by ID', async () => {
      const interaction = await contractInteractionService.createInteraction({
        studentId: testStudentId,
        contractName: 'DeleteContract',
        functionName: 'deleteFunction',
      });

      await contractInteractionService.deleteInteraction(interaction.id);

      const retrieved = await contractInteractionService.getInteractionById(interaction.id);
      expect(retrieved).toBeNull();
    });
  });
});
