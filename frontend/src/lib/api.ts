import { Job, CreateJobInput, OverlapCheckResult, User } from '../types/job';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const TOKEN_KEY = 'sjob_token';
const USER_KEY = 'sjob_user';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthSession = (token: string, user: User) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuthSession();
    throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
  }

  return data;
}

export const api = {
  // Auth
  async googleLogin(credential: string): Promise<{ accessToken: string; user: User }> {
    return fetchWithAuth('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  async login(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Jobs
  async getJobsByDate(date: string): Promise<Job[]> {
    return fetchWithAuth(`/jobs?date=${date}`);
  },

  async getJobsByRange(from: string, to: string): Promise<Job[]> {
    return fetchWithAuth(`/jobs/range?from=${from}&to=${to}`);
  },

  async createJob(input: CreateJobInput): Promise<Job> {
    return fetchWithAuth('/jobs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateJob(id: number | string, input: Partial<CreateJobInput>): Promise<Job> {
    return fetchWithAuth(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async deleteJob(id: number | string): Promise<{ message: string }> {
    return fetchWithAuth(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  async checkOverlap(
    date: string,
    startTime: string,
    endTime: string,
    excludeJobId?: number
  ): Promise<OverlapCheckResult> {
    return fetchWithAuth('/jobs/check-overlap', {
      method: 'POST',
      body: JSON.stringify({ date, startTime, endTime, excludeJobId }),
    });
  },

  async syncGuestJobs(jobs: CreateJobInput[]): Promise<{ count: number; message: string; jobs: Job[] }> {
    return fetchWithAuth('/jobs/sync-guest', {
      method: 'POST',
      body: JSON.stringify({ jobs }),
    });
  },
};
