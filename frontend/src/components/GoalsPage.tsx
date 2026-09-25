'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useJobs } from '../context/JobContext';
import { getMonthlyGoal, saveMonthlyGoal } from '../lib/storage';
import { MonthlyGoal } from '../types/job';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  Check,
  Edit3,
  Eye,
  EyeOff,
  X,
  Briefcase,
  TrendingUp,
  CalendarDays,
  Plus,
} from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { allJobs } = useJobs();

  // Selected month: 'YYYY-MM'
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Goal state for selected month
  const [goal, setGoal] = useState<MonthlyGoal | null>(null);

  // Privacy eye (default false)
  const [showEarnings, setShowEarnings] = useState<boolean>(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [targetRevenueInput, setTargetRevenueInput] = useState<string>('15000000');
  const [targetDaysInput, setTargetDaysInput] = useState<string>('20');

  // Load goal on month change
  useEffect(() => {
    const loaded = getMonthlyGoal(selectedMonth);
    setGoal(loaded);
    if (loaded) {
      setTargetRevenueInput(String(loaded.targetRevenue));
      setTargetDaysInput(String(loaded.targetDays));
    } else {
      setTargetRevenueInput('15000000');
      setTargetDaysInput('20');
    }
  }, [selectedMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleResetToCurrentMonth = () => {
    setSelectedMonth(currentMonthKey);
  };

  // Month metadata
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const monthName = `Tháng ${monthNum}, ${yearNum}`;
  const isCurrentMonth = selectedMonth === currentMonthKey;

  // Days in month & Days remaining
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const daysRemaining = useMemo(() => {
    if (!isCurrentMonth) {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sel = new Date(yearNum, monthNum - 1, 1);
      return sel < thisMonth ? 0 : daysInMonth;
    }
    const todayDate = today.getDate();
    return Math.max(0, daysInMonth - todayDate);
  }, [isCurrentMonth, yearNum, monthNum, daysInMonth, today]);

  // Jobs calculation for this month
  const monthJobs = useMemo(() => {
    return allJobs.filter((j) => j.date.startsWith(selectedMonth));
  }, [allJobs, selectedMonth]);

  const actualRevenue = useMemo(() => {
    return monthJobs.reduce((sum, j) => sum + (Number(j.cost) || 0), 0);
  }, [monthJobs]);

  const actualWorkingDays = useMemo(() => {
    const uniqueDays = new Set(monthJobs.map((j) => j.date));
    return uniqueDays.size;
  }, [monthJobs]);

  const totalJobsCount = monthJobs.length;

  // Targets & Progress
  const targetRevenue = goal?.targetRevenue ?? 0;
  const targetDays = goal?.targetDays ?? 0;

  const revenueProgress = targetRevenue > 0 ? Math.round((actualRevenue / targetRevenue) * 100) : 0;
  const daysProgress = targetDays > 0 ? Math.round((actualWorkingDays / targetDays) * 100) : 0;

  const revenueRemaining = Math.max(0, targetRevenue - actualRevenue);
  const daysRemainingToGoal = Math.max(0, targetDays - actualWorkingDays);

  // Daily pace required
  const dailyPaceNeeded = useMemo(() => {
    if (!isCurrentMonth || daysRemaining <= 0 || revenueRemaining <= 0) return 0;
    return Math.round(revenueRemaining / daysRemaining);
  }, [isCurrentMonth, daysRemaining, revenueRemaining]);

  // Save goal handler
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const rev = Number(targetRevenueInput) || 0;
    const days = Number(targetDaysInput) || 0;
    const newGoal: MonthlyGoal = {
      month: selectedMonth,
      targetRevenue: rev,
      targetDays: days,
    };
    saveMonthlyGoal(newGoal);
    setGoal(newGoal);
    setIsModalOpen(false);
  };

  return (
    <div className="clean-goals-page">
      {/* Top Header: Month Switcher & Actions */}
      <div className="clean-month-header">
        <div className="clean-month-nav">
          <button className="clean-nav-btn" onClick={handlePrevMonth} title="Tháng trước">
            <ChevronLeft size={16} />
          </button>
          <div className="clean-month-info">
            <h2 className="clean-month-title">{monthName}</h2>
            {!isCurrentMonth && (
              <button className="clean-btn-back-current" onClick={handleResetToCurrentMonth}>
                Về tháng này
              </button>
            )}
          </div>
          <button className="clean-nav-btn" onClick={handleNextMonth} title="Tháng sau">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="clean-header-actions">
          <button
            type="button"
            className="clean-icon-pill"
            onClick={() => setShowEarnings(!showEarnings)}
            title={showEarnings ? 'Ẩn số tiền' : 'Hiện số tiền'}
          >
            {showEarnings ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>

          <button
            className="clean-btn-edit-goal"
            onClick={() => setIsModalOpen(true)}
            title="Cài đặt chỉ tiêu"
          >
            <Edit3 size={13} />
            <span>{goal ? 'Sửa' : 'Đặt mục tiêu'}</span>
          </button>
        </div>
      </div>

      {/* If No Goal Set Yet: Minimalist Clean Prompt */}
      {!goal ? (
        <div className="clean-empty-card">
          <div className="clean-empty-icon">
            <Target size={28} />
          </div>
          <div className="clean-empty-text">
            <h3>Chưa đặt mục tiêu {monthName}</h3>
            <p>Đặt chỉ tiêu thu nhập và số ngày làm việc để theo dõi tiến độ mỗi ngày.</p>
          </div>
          <button className="clean-btn-set-goal" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Thiết lập chỉ tiêu</span>
          </button>
        </div>
      ) : (
        /* The 2 Core Goal Cards */
        <div className="clean-goals-stack">
          {/* Card 1: Revenue Goal */}
          <div className="clean-goal-card">
            <div className="clean-card-head">
              <div className="clean-card-label">
                <span className="clean-icon-box emerald">
                  <DollarSign size={15} />
                </span>
                <span className="clean-card-name">Thu nhập</span>
              </div>
              <span className={`clean-progress-chip ${revenueProgress >= 100 ? 'done' : ''}`}>
                {revenueProgress >= 100 ? '✓ Đạt 100%' : `${revenueProgress}%`}
              </span>
            </div>

            <div className="clean-amount-row">
              <div className="clean-main-num emerald">
                {showEarnings ? `${Number(actualRevenue).toLocaleString('vi-VN')}đ` : '••••••••'}
              </div>
              <div className="clean-target-num">
                / {targetRevenue > 0 ? (showEarnings ? `${Number(targetRevenue).toLocaleString('vi-VN')}đ` : '••••••••') : '0đ'}
              </div>
            </div>

            {/* Progress bar */}
            <div className="clean-progress-track">
              <div
                className="clean-progress-fill emerald"
                style={{ width: `${Math.min(100, revenueProgress)}%` }}
              />
            </div>

            {/* Bottom info */}
            <div className="clean-card-bottom">
              {actualRevenue >= targetRevenue ? (
                <span className="clean-tag-success">
                  <Check size={12} strokeWidth={3} /> Vượt chỉ tiêu +{showEarnings ? `${Number(actualRevenue - targetRevenue).toLocaleString('vi-VN')}đ` : '••••••'}
                </span>
              ) : (
                <div className="clean-remaining-row">
                  <span>Còn thiếu <strong>{showEarnings ? `${Number(revenueRemaining).toLocaleString('vi-VN')}đ` : '••••••'}</strong></span>
                  {dailyPaceNeeded > 0 && isCurrentMonth && (
                    <span className="clean-pace-text">
                      (~{showEarnings ? `${Number(dailyPaceNeeded).toLocaleString('vi-VN')}đ` : '••••'}/ngày)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Working Days Goal */}
          <div className="clean-goal-card">
            <div className="clean-card-head">
              <div className="clean-card-label">
                <span className="clean-icon-box cyan">
                  <CalendarDays size={15} />
                </span>
                <span className="clean-card-name">Ngày đi làm</span>
              </div>
              <span className={`clean-progress-chip cyan ${daysProgress >= 100 ? 'done' : ''}`}>
                {daysProgress >= 100 ? '✓ Đạt 100%' : `${daysProgress}%`}
              </span>
            </div>

            <div className="clean-amount-row">
              <div className="clean-main-num cyan">
                {actualWorkingDays} ngày
              </div>
              <div className="clean-target-num">
                / {targetDays > 0 ? `${targetDays} ngày` : '0 ngày'}
              </div>
            </div>

            {/* Progress bar */}
            <div className="clean-progress-track">
              <div
                className="clean-progress-fill cyan"
                style={{ width: `${Math.min(100, daysProgress)}%` }}
              />
            </div>

            {/* Bottom info */}
            <div className="clean-card-bottom">
              {actualWorkingDays >= targetDays ? (
                <span className="clean-tag-success cyan">
                  <Check size={12} strokeWidth={3} /> Đạt chỉ tiêu (+{actualWorkingDays - targetDays} ngày)
                </span>
              ) : (
                <span className="clean-remaining-row">
                  Cần thêm <strong>{daysRemainingToGoal} ngày</strong> làm việc nữa
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mini Stats Summary Bar */}
      <div className="clean-stats-row">
        <div className="clean-stat-box">
          <div className="clean-stat-left">
            <Briefcase size={15} className="clean-stat-icon purple" />
            <span className="clean-stat-title">Số công việc</span>
          </div>
          <span className="clean-stat-val">{totalJobsCount} việc</span>
        </div>

        <div className="clean-stat-box">
          <div className="clean-stat-left">
            <TrendingUp size={15} className="clean-stat-icon green" />
            <span className="clean-stat-title">TB mỗi việc</span>
          </div>
          <span className="clean-stat-val">
            {totalJobsCount > 0
              ? showEarnings
                ? `${Math.round(actualRevenue / totalJobsCount).toLocaleString('vi-VN')}đ`
                : '••••••'
              : '0đ'}
          </span>
        </div>
      </div>

      {/* Modal: Set / Edit Goals */}
      {isModalOpen && (
        <div className="bottom-sheet-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="bottom-sheet-container clean-goal-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drag-handle" />

            <div className="sheet-header">
              <span className="sheet-title">Đặt chỉ tiêu {monthName}</span>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="clean-goal-form">
              {/* Target Revenue Input */}
              <div className="form-group">
                <label className="form-label">
                  Mục tiêu Thu nhập (VNĐ)
                  {targetRevenueInput && (
                    <span className="clean-modal-preview">
                      : {Number(targetRevenueInput).toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </label>
                <div className="cost-input-wrapper">
                  <DollarSign size={16} className="cost-input-icon" />
                  <input
                    type="number"
                    className="form-input cost-input"
                    placeholder="VD: 15000000"
                    value={targetRevenueInput}
                    onChange={(e) => setTargetRevenueInput(e.target.value)}
                    min="0"
                    step="500000"
                    inputMode="numeric"
                  />
                </div>
                {/* Quick Chips */}
                <div className="clean-chips-row">
                  {[10000000, 15000000, 20000000, 25000000, 30000000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`clean-chip ${Number(targetRevenueInput) === amount ? 'selected' : ''}`}
                      onClick={() => setTargetRevenueInput(String(amount))}
                    >
                      {amount / 1000000} triệu
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Days Input */}
              <div className="form-group">
                <label className="form-label">
                  Mục tiêu Ngày làm việc (Số ngày)
                </label>
                <div className="cost-input-wrapper">
                  <CalendarDays size={16} className="cost-input-icon" />
                  <input
                    type="number"
                    className="form-input cost-input"
                    placeholder="VD: 20"
                    value={targetDaysInput}
                    onChange={(e) => setTargetDaysInput(e.target.value)}
                    min="1"
                    max={daysInMonth}
                    inputMode="numeric"
                  />
                </div>
                {/* Quick Chips */}
                <div className="clean-chips-row">
                  {[15, 20, 22, 26].map((days) => (
                    <button
                      key={days}
                      type="button"
                      className={`clean-chip ${Number(targetDaysInput) === days ? 'selected' : ''}`}
                      onClick={() => setTargetDaysInput(String(days))}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                <Check size={18} />
                <span>Lưu chỉ tiêu {monthName}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
