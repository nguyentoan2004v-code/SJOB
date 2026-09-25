import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkGuestOverlap } from './storage';
import { Job } from '../types/job';

describe('Storage - Guest Overlap Logic', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    // Mock localStorage in node environment
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    });

    vi.stubGlobal('window', {});
  });

  const setExistingJobs = (jobs: Partial<Job>[]) => {
    mockStorage['sjob_guest_jobs'] = JSON.stringify(jobs);
  };

  it('Scenario 1: Returns hasOverlap: false when guest storage is empty', () => {
    setExistingJobs([]);

    const result = checkGuestOverlap('2026-09-25', '08:00', '10:00');

    expect(result.hasOverlap).toBe(false);
    expect(result.overlappingJobs).toHaveLength(0);
  });

  it('Scenario 2: Boundary touching (08:00 - 10:00 vs 10:00 - 12:00) does not overlap', () => {
    setExistingJobs([
      {
        id: 'job_1',
        title: 'Morning Job',
        date: '2026-09-25',
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    // Check adjacent slot
    const result = checkGuestOverlap('2026-09-25', '08:00', '10:00');

    expect(result.hasOverlap).toBe(false);
    expect(result.overlappingJobs).toHaveLength(0);
  });

  it('Scenario 3: Overlapping slot (09:30 - 11:30 vs 10:00 - 12:00) returns hasOverlap: true', () => {
    setExistingJobs([
      {
        id: 'job_1',
        title: 'Morning Job',
        date: '2026-09-25',
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    const result = checkGuestOverlap('2026-09-25', '09:30', '11:30');

    expect(result.hasOverlap).toBe(true);
    expect(result.overlappingJobs).toHaveLength(1);
    expect(result.overlappingJobs[0].id).toBe('job_1');
  });

  it('Scenario 4: Different dates do not overlap', () => {
    setExistingJobs([
      {
        id: 'job_1',
        title: 'Job Tomorrow',
        date: '2026-09-26',
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    // Same time, different date
    const result = checkGuestOverlap('2026-09-25', '10:00', '12:00');

    expect(result.hasOverlap).toBe(false);
  });

  it('Scenario 5: Exclude editing job id prevents self-overlap', () => {
    setExistingJobs([
      {
        id: 'job_edit_123',
        title: 'My Job',
        date: '2026-09-25',
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    const result = checkGuestOverlap('2026-09-25', '10:30', '12:30', 'job_edit_123');

    expect(result.hasOverlap).toBe(false);
  });
});
