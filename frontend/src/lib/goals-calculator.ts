import { Job, MonthlyGoal } from '../types/job';

export interface MonthSummary {
  monthKey: string;
  totalRevenue: number;
  workingDaysCount: number;
  jobCount: number;
  averagePerJob: number;
  uniqueDates: string[];
}

export interface GoalProgress {
  hasGoal: boolean;
  revenuePercent: number;
  daysPercent: number;
  isRevenueAchieved: boolean;
  isDaysAchieved: boolean;
  isFullyAchieved: boolean;
  remainingRevenue: number;
  remainingDays: number;
  dailyRevenuePace: number;
}

/**
 * Tính toán số liệu công việc và thu nhập thực tế trong một tháng
 */
export function calculateMonthSummary(jobs: Job[], monthKey: string): MonthSummary {
  const monthJobs = jobs.filter((j) => j.date && j.date.startsWith(monthKey));
  const datesSet = new Set<string>();
  let totalRevenue = 0;

  for (const job of monthJobs) {
    if (job.cost != null) {
      totalRevenue += Number(job.cost) || 0;
    }
    datesSet.add(job.date);
  }

  const jobCount = monthJobs.length;
  const workingDaysCount = datesSet.size;
  const averagePerJob = jobCount > 0 ? Math.round(totalRevenue / jobCount) : 0;

  return {
    monthKey,
    totalRevenue,
    workingDaysCount,
    jobCount,
    averagePerJob,
    uniqueDates: Array.from(datesSet).sort(),
  };
}

/**
 * Tính toán tiến độ hoàn thành so với mục tiêu tháng (Goal Progress)
 */
export function calculateGoalProgress(
  summary: MonthSummary,
  goal: MonthlyGoal | null,
  remainingDaysInMonth: number = 0
): GoalProgress {
  if (!goal || (goal.targetRevenue <= 0 && goal.targetDays <= 0)) {
    return {
      hasGoal: false,
      revenuePercent: 0,
      daysPercent: 0,
      isRevenueAchieved: false,
      isDaysAchieved: false,
      isFullyAchieved: false,
      remainingRevenue: 0,
      remainingDays: 0,
      dailyRevenuePace: 0,
    };
  }

  const revenuePercent =
    goal.targetRevenue > 0
      ? Math.round((summary.totalRevenue / goal.targetRevenue) * 100)
      : 0;

  const daysPercent =
    goal.targetDays > 0
      ? Math.round((summary.workingDaysCount / goal.targetDays) * 100)
      : 0;

  const isRevenueAchieved = goal.targetRevenue > 0 && summary.totalRevenue >= goal.targetRevenue;
  const isDaysAchieved = goal.targetDays > 0 && summary.workingDaysCount >= goal.targetDays;
  const isFullyAchieved = isRevenueAchieved && isDaysAchieved;

  const remainingRevenue = Math.max(0, (goal.targetRevenue || 0) - summary.totalRevenue);
  const remainingDays = Math.max(0, (goal.targetDays || 0) - summary.workingDaysCount);

  const dailyRevenuePace =
    remainingRevenue > 0 && remainingDaysInMonth > 0
      ? Math.round(remainingRevenue / remainingDaysInMonth)
      : 0;

  return {
    hasGoal: true,
    revenuePercent,
    daysPercent,
    isRevenueAchieved,
    isDaysAchieved,
    isFullyAchieved,
    remainingRevenue,
    remainingDays,
    dailyRevenuePace,
  };
}
