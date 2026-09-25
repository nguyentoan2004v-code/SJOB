import { Job, CreateJobInput, OverlapCheckResult, MonthlyGoal } from '../types/job';

const GUEST_STORAGE_KEY = 'sjob_guest_jobs';
const GOALS_STORAGE_KEY = 'sjob_monthly_goals';

export const getGuestJobs = (): Job[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading guest jobs from localStorage', e);
    return [];
  }
};

export const saveGuestJob = (input: CreateJobInput, editId?: string | number): Job => {
  const jobs = getGuestJobs();
  const now = new Date().toISOString();

  if (editId !== undefined) {
    const index = jobs.findIndex((j) => String(j.id) === String(editId));
    if (index !== -1) {
      const updated: Job = {
        ...jobs[index],
        title: input.title,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        note: input.note || null,
        cost: input.cost ?? null,
        paid: input.paid ?? jobs[index].paid ?? false,
        updatedAt: now,
      };
      jobs[index] = updated;
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(jobs));
      return updated;
    }
  }

  const newJob: Job = {
    id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: input.title,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    note: input.note || null,
    cost: input.cost ?? null,
    paid: input.paid ?? false,
    createdAt: now,
    updatedAt: now,
  };

  jobs.push(newJob);
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(jobs));
  return newJob;
};

export const toggleGuestJobPaid = (id: string | number): Job | null => {
  const jobs = getGuestJobs();
  const index = jobs.findIndex((j) => String(j.id) === String(id));
  if (index !== -1) {
    jobs[index] = {
      ...jobs[index],
      paid: !jobs[index].paid,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(jobs));
    return jobs[index];
  }
  return null;
};

export const deleteGuestJob = (id: string | number): void => {
  const jobs = getGuestJobs();
  const filtered = jobs.filter((j) => String(j.id) !== String(id));
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(filtered));
};

export const checkGuestOverlap = (
  date: string,
  startTime: string,
  endTime: string,
  excludeJobId?: string | number
): OverlapCheckResult => {
  const jobs = getGuestJobs();
  const sameDateJobs = jobs.filter(
    (j) => j.date === date && (excludeJobId === undefined || String(j.id) !== String(excludeJobId))
  );

  const overlappingJobs = sameDateJobs.filter((job) => {
    return startTime < job.endTime && endTime > job.startTime;
  });

  return {
    hasOverlap: overlappingJobs.length > 0,
    overlappingJobs,
  };
};

export const clearGuestJobs = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  }
};

export const getAllMonthlyGoals = (): Record<string, MonthlyGoal> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading goals from localStorage', e);
    return {};
  }
};

export const getMonthlyGoal = (month: string): MonthlyGoal | null => {
  const all = getAllMonthlyGoals();
  return all[month] || null;
};

export const saveMonthlyGoal = (goal: MonthlyGoal): void => {
  if (typeof window === 'undefined') return;
  try {
    const all = getAllMonthlyGoals();
    all[goal.month] = {
      ...goal,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving goal to localStorage', e);
  }
};

