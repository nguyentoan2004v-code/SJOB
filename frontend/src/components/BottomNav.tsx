'use client';

import React from 'react';
import { useJobs } from '../context/JobContext';
import { Calendar, Target, Plus, User as UserIcon } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { openCreateSheet, selectedDate, activeTab, setActiveTab } = useJobs();

  return (
    <>
      {/* Floating Action Button (+) */}
      <button
        className="fab-btn"
        onClick={() => openCreateSheet(selectedDate)}
        title="Thêm công việc mới"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('calendar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Calendar size={20} />
          <span>Lịch biểu</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('goals');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <Target size={20} />
          <span>Chỉ tiêu</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <UserIcon size={20} />
          <span>Tài khoản</span>
        </button>
      </nav>
    </>
  );
};

