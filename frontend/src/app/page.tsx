'use client';

import React from 'react';
import { useJobs } from '../context/JobContext';
import { Header } from '../components/Header';
import { CalendarView } from '../components/CalendarView';
import { GoalsPage } from '../components/GoalsPage';
import { AccountPage } from '../components/AccountPage';
import { BottomNav } from '../components/BottomNav';
import { JobFormSheet } from '../components/JobFormSheet';
import { SyncPromptModal } from '../components/SyncPromptModal';
import { PWAInstallBanner } from '../components/PWAInstallBanner';

export default function Home() {
  const { activeTab } = useJobs();

  return (
    <>
      <Header />
      <main className="app-body">
        <PWAInstallBanner />
        {activeTab === 'goals' ? (
          <GoalsPage />
        ) : activeTab === 'account' ? (
          <AccountPage />
        ) : (
          <CalendarView />
        )}
      </main>
      <BottomNav />
      <JobFormSheet />
      <SyncPromptModal />
    </>
  );
}

