'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Job, CreateJobInput, OverlapCheckResult, User } from '../types/job';
import {
  getGuestJobs,
  saveGuestJob,
  toggleGuestJobPaid,
  deleteGuestJob,
  checkGuestOverlap,
  clearGuestJobs,
} from '../lib/storage';
import {
  api,
  getToken,
  setAuthSession,
  getStoredUser,
  clearAuthSession,
} from '../lib/api';

interface JobContextType {
  user: User | null;
  isGuest: boolean;
  selectedDate: string;
  jobsForSelectedDate: Job[];
  allJobs: Job[];
  isLoading: boolean;
  isSheetOpen: boolean;
  editingJob: Job | null;
  isSyncModalOpen: boolean;
  guestJobsToSyncCount: number;
  setSelectedDate: (date: string) => void;
  openCreateSheet: (date?: string) => void;
  openEditSheet: (job: Job) => void;
  closeSheet: () => void;
  saveJob: (input: CreateJobInput) => Promise<void>;
  toggleJobPaid: (job: Job) => Promise<void>;
  deleteJob: (id: string | number) => Promise<void>;
  checkOverlap: (
    date: string,
    startTime: string,
    endTime: string,
    excludeJobId?: string | number
  ) => Promise<OverlapCheckResult>;
  loginWithGoogle: (credential: string) => Promise<void>;
  confirmSyncGuestJobs: () => Promise<void>;
  skipSyncGuestJobs: () => void;
  logout: () => void;
  activeTab: 'calendar' | 'goals' | 'account';
  setActiveTab: (tab: 'calendar' | 'goals' | 'account') => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'goals' | 'account'>('calendar');

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Sync Modal state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [guestJobsToSyncCount, setGuestJobsToSyncCount] = useState<number>(0);

  const isGuest = !user;

  // Load Initial User & Jobs
  const loadJobs = useCallback(async (currentUser: User | null) => {
    setIsLoading(true);
    try {
      if (!currentUser) {
        // Guest mode -> load from localStorage
        const local = getGuestJobs();
        setAllJobs(local);
      } else {
        // Logged in user -> load from API
        // Load a wide range (e.g. 6 months back and forward)
        const d = new Date();
        const start = new Date(d.getFullYear(), d.getMonth() - 2, 1).toISOString().split('T')[0];
        const end = new Date(d.getFullYear(), d.getMonth() + 4, 0).toISOString().split('T')[0];
        const cloudJobs = await api.getJobsByRange(start, end);
        setAllJobs(cloudJobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      // Fallback to local
      setAllJobs(getGuestJobs());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
      loadJobs(storedUser);
    } else {
      loadJobs(null);
    }
  }, [loadJobs]);

  const jobsForSelectedDate = allJobs
    .filter((j) => j.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const openCreateSheet = (date?: string) => {
    if (date) setSelectedDate(date);
    setEditingJob(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (job: Job) => {
    setEditingJob(job);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setEditingJob(null);
  };

  const saveJob = async (input: CreateJobInput) => {
    if (isGuest) {
      saveGuestJob(input, editingJob?.id);
      setAllJobs(getGuestJobs());
      closeSheet();
    } else {
      if (editingJob) {
        await api.updateJob(editingJob.id, input);
      } else {
        await api.createJob(input);
      }
      await loadJobs(user);
      closeSheet();
    }
  };

  const toggleJobPaid = async (job: Job) => {
    const newPaidStatus = !job.paid;
    if (isGuest) {
      toggleGuestJobPaid(job.id);
      setAllJobs(getGuestJobs());
    } else {
      // Optimistic update for immediate feedback
      setAllJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, paid: newPaidStatus } : j))
      );
      try {
        await api.updateJob(job.id, { paid: newPaidStatus });
      } catch (err) {
        console.error('Failed to toggle paid status:', err);
        await loadJobs(user);
      }
    }
  };

  const deleteJob = async (id: string | number) => {
    if (isGuest) {
      deleteGuestJob(id);
      setAllJobs(getGuestJobs());
    } else {
      await api.deleteJob(id);
      await loadJobs(user);
    }
  };

  const checkOverlap = async (
    date: string,
    startTime: string,
    endTime: string,
    excludeJobId?: string | number
  ): Promise<OverlapCheckResult> => {
    if (isGuest) {
      return checkGuestOverlap(date, startTime, endTime, excludeJobId);
    } else {
      return api.checkOverlap(
        date,
        startTime,
        endTime,
        typeof excludeJobId === 'number' ? excludeJobId : undefined
      );
    }
  };

  // Google Login & Sync Detection
  const loginWithGoogle = async (credential: string) => {
    try {
      const res = await api.googleLogin(credential);
      setAuthSession(res.accessToken, res.user);
      setUser(res.user);

      // Check if there are existing guest jobs
      const existingGuest = getGuestJobs();
      if (existingGuest.length > 0) {
        setGuestJobsToSyncCount(existingGuest.length);
        setIsSyncModalOpen(true);
      } else {
        await loadJobs(res.user);
      }
    } catch (err: any) {
      alert(err.message || 'Đăng nhập Google thất bại');
    }
  };

  const confirmSyncGuestJobs = async () => {
    const existingGuest = getGuestJobs();
    if (existingGuest.length > 0) {
      try {
        const payload: CreateJobInput[] = existingGuest.map((j) => ({
          title: j.title,
          date: j.date,
          startTime: j.startTime,
          endTime: j.endTime,
          note: j.note || undefined,
          cost: j.cost ?? undefined,
          paid: j.paid ?? false,
        }));
        await api.syncGuestJobs(payload);
        clearGuestJobs();
      } catch (err: any) {
        console.error('Failed to sync guest jobs:', err);
      }
    }
    setIsSyncModalOpen(false);
    await loadJobs(user);
  };

  const skipSyncGuestJobs = () => {
    setIsSyncModalOpen(false);
    loadJobs(user);
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    loadJobs(null);
  };

  return (
    <JobContext.Provider
      value={{
        user,
        isGuest,
        selectedDate,
        jobsForSelectedDate,
        allJobs,
        isLoading,
        isSheetOpen,
        editingJob,
        isSyncModalOpen,
        guestJobsToSyncCount,
        setSelectedDate,
        openCreateSheet,
        openEditSheet,
        closeSheet,
        saveJob,
        toggleJobPaid,
        deleteJob,
        checkOverlap,
        loginWithGoogle,
        confirmSyncGuestJobs,
        skipSyncGuestJobs,
        logout,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
