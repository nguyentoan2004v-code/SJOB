export interface Job {
  id: string | number;
  userId?: number;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  note?: string | null;
  cost?: number | null;
  paid?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobInput {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  cost?: number;
  paid?: boolean;
}

export interface OverlapCheckResult {
  hasOverlap: boolean;
  overlappingJobs: Job[];
}

export interface User {
  id: number;
  email: string;
  name?: string | null;
  avatar?: string | null;
}

export interface MonthlyGoal {
  month: string; // YYYY-MM
  targetRevenue: number;
  targetDays: number;
  updatedAt?: string;
}

