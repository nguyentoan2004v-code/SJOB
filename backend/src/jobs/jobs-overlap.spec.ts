import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsService } from './jobs.service.js';
import { BadRequestException } from '@nestjs/common';

describe('JobsService - Overlap Detection Logic', () => {
  let service: JobsService;
  let mockPrisma: any;

  const toTimeDate = (timeStr: string) => new Date(`1970-01-01T${timeStr}:00.000Z`);

  // Helper to create mock DB job record
  const createMockJob = (id: number, startTime: string, endTime: string, title = 'Existing Job') => ({
    id,
    userId: 1,
    title,
    date: new Date('2026-09-25T00:00:00.000Z'),
    startTime: toTimeDate(startTime),
    endTime: toTimeDate(endTime),
    note: null,
    cost: null,
    paid: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockPrisma = {
      job: {
        findMany: vi.fn(),
      },
    };
    service = new JobsService(mockPrisma);
  });

  describe('Validation', () => {
    it('should throw BadRequestException when startTime equals endTime', async () => {
      await expect(
        service.checkOverlap(1, {
          date: '2026-09-25',
          startTime: '10:00',
          endTime: '10:00',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when startTime is after endTime', async () => {
      await expect(
        service.checkOverlap(1, {
          date: '2026-09-25',
          startTime: '14:00',
          endTime: '10:00',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Overlap Scenarios', () => {
    it('Scenario 1: No jobs on date -> returns hasOverlap: false', async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '09:00',
        endTime: '11:00',
      });

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingJobs).toHaveLength(0);
    });

    it('Scenario 2: New job is completely before existing job -> hasOverlap: false', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00')]);

      // New job: 08:00 - 09:30
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '08:00',
        endTime: '09:30',
      });

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingJobs).toHaveLength(0);
    });

    it('Scenario 3: New job is completely after existing job -> hasOverlap: false', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00')]);

      // New job: 13:00 - 15:00
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '13:00',
        endTime: '15:00',
      });

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingJobs).toHaveLength(0);
    });

    it('Scenario 4: Boundary touching - new job ends exactly when existing starts -> hasOverlap: false', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00')]);

      // New job: 08:00 - 10:00
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '08:00',
        endTime: '10:00',
      });

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingJobs).toHaveLength(0);
    });

    it('Scenario 5: Boundary touching - new job starts exactly when existing ends -> hasOverlap: false', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00')]);

      // New job: 12:00 - 14:00
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '12:00',
        endTime: '14:00',
      });

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingJobs).toHaveLength(0);
    });

    it('Scenario 6: Left overlap - new job starts before and ends inside existing job -> hasOverlap: true', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00', 'Job Sáng')]);

      // New job: 09:00 - 10:30
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '09:00',
        endTime: '10:30',
      });

      expect(result.hasOverlap).toBe(true);
      expect(result.overlappingJobs).toHaveLength(1);
      expect(result.overlappingJobs[0].id).toBe(1);
    });

    it('Scenario 7: Right overlap - new job starts inside and ends after existing job -> hasOverlap: true', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00')]);

      // New job: 11:30 - 13:00
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '11:30',
        endTime: '13:00',
      });

      expect(result.hasOverlap).toBe(true);
      expect(result.overlappingJobs).toHaveLength(1);
      expect(result.overlappingJobs[0].id).toBe(1);
    });

    it('Scenario 8: Inner overlap - new job is completely inside existing job -> hasOverlap: true', async () => {
      // Existing job: 09:00 - 17:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '09:00', '17:00')]);

      // New job: 13:00 - 15:00
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '13:00',
        endTime: '15:00',
      });

      expect(result.hasOverlap).toBe(true);
      expect(result.overlappingJobs).toHaveLength(1);
    });

    it('Scenario 9: Engulfing overlap - new job starts before and ends after existing job -> hasOverlap: true', async () => {
      // Existing job: 10:00 - 12:00
      mockPrisma.job.findMany.mockResolvedValue([createMockJob(1, '10:00', '12:00')]);

      // New job: 08:00 - 14:00
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '08:00',
        endTime: '14:00',
      });

      expect(result.hasOverlap).toBe(true);
      expect(result.overlappingJobs).toHaveLength(1);
    });

    it('Scenario 10: Multiple jobs overlap - new job overlaps with 2 distinct jobs -> returns both', async () => {
      // Job 1: 08:00 - 10:00, Job 2: 11:00 - 13:00
      mockPrisma.job.findMany.mockResolvedValue([
        createMockJob(1, '08:00', '10:00', 'Job 1'),
        createMockJob(2, '11:00', '13:00', 'Job 2'),
      ]);

      // New job: 09:00 - 12:00 (overlaps with both Job 1 and Job 2)
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '09:00',
        endTime: '12:00',
      });

      expect(result.hasOverlap).toBe(true);
      expect(result.overlappingJobs).toHaveLength(2);
      expect(result.overlappingJobs.map((j) => j.id)).toEqual([1, 2]);
    });

    it('Scenario 11: Exclude own job id when updating -> does not report self-overlap', async () => {
      // Existing jobs: Job 1 (being edited)
      mockPrisma.job.findMany.mockImplementation(async (args: any) => {
        // Prisma filter should exclude id = 1
        if (args.where?.id?.not === 1) {
          return [];
        }
        return [createMockJob(1, '10:00', '12:00')];
      });

      // User updates Job 1 with slight time change: 10:30 - 12:30
      const result = await service.checkOverlap(1, {
        date: '2026-09-25',
        startTime: '10:30',
        endTime: '12:30',
        excludeJobId: 1,
      });

      expect(result.hasOverlap).toBe(false);
      expect(result.overlappingJobs).toHaveLength(0);
    });
  });
});
