import { describe, it, expect } from 'vitest';
import {
  calculateMonthSummary,
  calculateGoalProgress,
  MonthSummary,
} from './goals-calculator';
import { Job, MonthlyGoal } from '../types/job';

describe('Goals Calculator - Unit Test Suite', () => {
  const createTestJob = (
    id: string | number,
    date: string,
    cost: number | null = null,
    title = 'Job'
  ): Job => ({
    id,
    title,
    date,
    startTime: '08:00',
    endTime: '12:00',
    cost,
    paid: true,
  });

  describe('calculateMonthSummary', () => {
    it('returns zeroes when jobs array is empty', () => {
      const summary = calculateMonthSummary([], '2026-09');

      expect(summary.totalRevenue).toBe(0);
      expect(summary.workingDaysCount).toBe(0);
      expect(summary.jobCount).toBe(0);
      expect(summary.averagePerJob).toBe(0);
      expect(summary.uniqueDates).toHaveLength(0);
    });

    it('filters out jobs from other months', () => {
      const jobs: Job[] = [
        createTestJob(1, '2026-08-31', 1000000), // Month 8
        createTestJob(2, '2026-09-01', 2000000), // Month 9
        createTestJob(3, '2026-10-01', 3000000), // Month 10
      ];

      const summary = calculateMonthSummary(jobs, '2026-09');

      expect(summary.jobCount).toBe(1);
      expect(summary.totalRevenue).toBe(2000000);
      expect(summary.workingDaysCount).toBe(1);
      expect(summary.uniqueDates).toEqual(['2026-09-01']);
    });

    it('counts multiple jobs on the same day as 1 working day but sums revenue', () => {
      const jobs: Job[] = [
        createTestJob(1, '2026-09-15', 500000, 'Job Sáng'),
        createTestJob(2, '2026-09-15', 800000, 'Job Chiều'),
        createTestJob(3, '2026-09-15', 700000, 'Job Tối'),
        createTestJob(4, '2026-09-20', 1000000, 'Job Ngày khác'),
      ];

      const summary = calculateMonthSummary(jobs, '2026-09');

      expect(summary.jobCount).toBe(4);
      expect(summary.workingDaysCount).toBe(2); // Only 2 distinct days: 15th and 20th
      expect(summary.totalRevenue).toBe(3000000); // 500k + 800k + 700k + 1tr
      expect(summary.averagePerJob).toBe(750000); // 3000000 / 4
    });

    it('handles null, undefined or 0 costs safely without NaN', () => {
      const jobs: Job[] = [
        createTestJob(1, '2026-09-05', null),
        createTestJob(2, '2026-09-06', undefined as any),
        createTestJob(3, '2026-09-07', 0),
        createTestJob(4, '2026-09-08', 1500000),
      ];

      const summary = calculateMonthSummary(jobs, '2026-09');

      expect(summary.jobCount).toBe(4);
      expect(summary.totalRevenue).toBe(1500000);
      expect(summary.averagePerJob).toBe(375000); // 1.5tr / 4 jobs
    });
  });

  describe('calculateGoalProgress', () => {
    const dummySummary: MonthSummary = {
      monthKey: '2026-09',
      totalRevenue: 10000000, // 10tr
      workingDaysCount: 15,
      jobCount: 18,
      averagePerJob: 555556,
      uniqueDates: [],
    };

    it('returns hasGoal: false when goal is null or 0', () => {
      const progress = calculateGoalProgress(dummySummary, null);

      expect(progress.hasGoal).toBe(false);
      expect(progress.revenuePercent).toBe(0);
      expect(progress.isFullyAchieved).toBe(false);
    });

    it('calculates partial progress accurately', () => {
      const goal: MonthlyGoal = {
        month: '2026-09',
        targetRevenue: 20000000, // 20tr target (actual is 10tr -> 50%)
        targetDays: 20, // 20 days target (actual is 15 -> 75%)
      };

      const progress = calculateGoalProgress(dummySummary, goal, 10); // 10 days remaining

      expect(progress.hasGoal).toBe(true);
      expect(progress.revenuePercent).toBe(50);
      expect(progress.daysPercent).toBe(75);
      expect(progress.isRevenueAchieved).toBe(false);
      expect(progress.isDaysAchieved).toBe(false);
      expect(progress.isFullyAchieved).toBe(false);
      expect(progress.remainingRevenue).toBe(10000000); // 20tr - 10tr = 10tr
      expect(progress.remainingDays).toBe(5); // 20 - 15 = 5 days
      expect(progress.dailyRevenuePace).toBe(1000000); // 10tr / 10 remaining days = 1tr/day
    });

    it('flags achieved when actual meets or exceeds target', () => {
      const goal: MonthlyGoal = {
        month: '2026-09',
        targetRevenue: 8000000, // 8tr target (actual is 10tr -> 125%)
        targetDays: 12, // 12 days target (actual is 15 -> 125%)
      };

      const progress = calculateGoalProgress(dummySummary, goal, 5);

      expect(progress.isRevenueAchieved).toBe(true);
      expect(progress.isDaysAchieved).toBe(true);
      expect(progress.isFullyAchieved).toBe(true);
      expect(progress.revenuePercent).toBe(125);
      expect(progress.daysPercent).toBe(125);
      expect(progress.remainingRevenue).toBe(0); // Not negative
      expect(progress.remainingDays).toBe(0);
      expect(progress.dailyRevenuePace).toBe(0);
    });

    it('handles edge case where 0 remaining days left in month', () => {
      const goal: MonthlyGoal = {
        month: '2026-09',
        targetRevenue: 15000000,
        targetDays: 20,
      };

      const progress = calculateGoalProgress(dummySummary, goal, 0);

      expect(progress.remainingRevenue).toBe(5000000);
      expect(progress.dailyRevenuePace).toBe(0); // No division by zero
    });
  });
});
