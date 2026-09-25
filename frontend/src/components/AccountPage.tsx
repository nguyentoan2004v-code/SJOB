'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useJobs } from '../context/JobContext';
import { clearGuestJobs, getAllMonthlyGoals, getMonthlyGoal } from '../lib/storage';
import { MonthlyGoal } from '../types/job';
import {
  ShieldCheck,
  Cloud,
  LogOut,
  Database,
  Download,
  Edit2,
  Trash2,
  CalendarCheck,
  Save,
  Wallet,
  Briefcase,
  TrendingUp,
  Target,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Award,
  Smartphone,
} from 'lucide-react';

type TimeFilter = 'all' | 'this_month' | 'last_month';

export const AccountPage: React.FC = () => {
  const { user, isGuest, logout, loginWithGoogle, allJobs, setActiveTab } = useJobs();

  // Profile name state
  const [guestName, setGuestName] = useState<string>('Freelancer');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');

  // Eye toggle state (mặc định luôn ở trạng thái tắt)
  const [showEarnings, setShowEarnings] = useState<boolean>(false);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Monthly goals map
  const [goalsMap, setGoalsMap] = useState<Record<string, MonthlyGoal>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sjob_guest_name');
      if (stored) {
        setGuestName(stored);
      }
      setGoalsMap(getAllMonthlyGoals());
    }
  }, []);

  const handleStartEditName = () => {
    setNameInput(guestName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setGuestName(trimmed);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sjob_guest_name', trimmed);
      }
    }
    setIsEditingName(false);
  };

  // Filter calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthNum = currentMonth === 0 ? 12 : currentMonth;
  const lastMonthKey = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}`;

  const filteredJobs = useMemo(() => {
    if (timeFilter === 'this_month') {
      return allJobs.filter((j) => j.date.startsWith(currentMonthKey));
    }
    if (timeFilter === 'last_month') {
      return allJobs.filter((j) => j.date.startsWith(lastMonthKey));
    }
    return allJobs;
  }, [allJobs, timeFilter, currentMonthKey, lastMonthKey]);

  // Key metrics for filtered view
  const totalFilteredEarnings = useMemo(
    () => filteredJobs.reduce((sum, j) => sum + (Number(j.cost) || 0), 0),
    [filteredJobs]
  );
  const filteredWorkingDays = useMemo(
    () => new Set(filteredJobs.map((j) => j.date)).size,
    [filteredJobs]
  );
  const filteredJobCount = filteredJobs.length;
  const averagePerJob = filteredJobCount > 0 ? Math.round(totalFilteredEarnings / filteredJobCount) : 0;

  // Current month stats specifically for Goal tracking
  const currentMonthJobs = useMemo(
    () => allJobs.filter((j) => j.date.startsWith(currentMonthKey)),
    [allJobs, currentMonthKey]
  );
  const currentMonthEarnings = useMemo(
    () => currentMonthJobs.reduce((sum, j) => sum + (Number(j.cost) || 0), 0),
    [currentMonthJobs]
  );
  const currentMonthWorkingDays = useMemo(
    () => new Set(currentMonthJobs.map((j) => j.date)).size,
    [currentMonthJobs]
  );
  const currentMonthGoal = goalsMap[currentMonthKey] || null;

  // Monthly breakdown (Group allJobs by YYYY-MM)
  const monthlyStats = useMemo(() => {
    const groups: Record<
      string,
      { monthKey: string; earnings: number; jobCount: number; dates: Set<string> }
    > = {};

    allJobs.forEach((job) => {
      const monthKey = job.date.substring(0, 7); // YYYY-MM
      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          earnings: 0,
          jobCount: 0,
          dates: new Set(),
        };
      }
      groups[monthKey].earnings += Number(job.cost) || 0;
      groups[monthKey].jobCount += 1;
      groups[monthKey].dates.add(job.date);
    });

    const sorted = Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    return sorted;
  }, [allJobs]);

  const maxMonthEarnings = useMemo(() => {
    if (monthlyStats.length === 0) return 1;
    return Math.max(...monthlyStats.map((m) => m.earnings), 1);
  }, [monthlyStats]);


  // Export JSON backup
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(allJobs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sjob-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear local data
  const handleClearLocalData = () => {
    if (
      confirm(
        'Bạn có chắc muốn xóa toàn bộ công việc trên máy này không? Hành động này không thể hoàn tác!'
      )
    ) {
      clearGuestJobs();
      window.location.reload();
    }
  };

  // Google Login mock
  const handleGoogleClick = () => {
    const fakeGooglePayload = {
      email: 'freelancer.pro@gmail.com',
      sub: 'google_1029384756',
      name: guestName || 'Freelancer Pro',
      picture:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    };
    const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
      JSON.stringify(fakeGooglePayload)
    )}.mocksignature`;
    loginWithGoogle(mockJwt);
  };

  const formatMonthTitle = (key: string) => {
    const [y, m] = key.split('-');
    return `Tháng ${parseInt(m, 10)}/${y}`;
  };

  return (
    <div className="account-page-container">
      {/* 1. Header Profile Banner */}
      <div className="account-hero-card">
        <div className="hero-avatar-slot">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="Avatar" className="hero-avatar-img" />
          ) : (
            <div className="hero-avatar-fallback">
              {isGuest
                ? guestName ? guestName[0].toUpperCase() : 'F'
                : user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}
        </div>

        <div className="hero-info-slot">
          <div className="hero-name-row">
            {isEditingName ? (
              <div className="name-edit-inline">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="name-edit-input"
                  placeholder="Nhập tên..."
                  autoFocus
                />
                <button className="btn-name-save" onClick={handleSaveName} title="Lưu">
                  <Save size={13} />
                </button>
              </div>
            ) : (
              <>
                <h2 className="hero-name-text">
                  {isGuest ? guestName : user?.name || user?.email}
                </h2>
                {isGuest && (
                  <button
                    className="btn-edit-inline"
                    onClick={handleStartEditName}
                    title="Đổi tên hiển thị"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </>
            )}
          </div>

          <div className="hero-badges-row">
            <span className={`account-badge-pill ${isGuest ? 'guest' : 'cloud'}`}>
              {isGuest ? (
                <>
                  <ShieldCheck size={13} />
                  <span>Bản máy (Offline-ready)</span>
                </>
              ) : (
                <>
                  <Cloud size={13} />
                  <span>Đã đồng bộ Google Cloud</span>
                </>
              )}
            </span>

            {/* Nút con mắt bảo mật */}
            <button
              type="button"
              className="btn-privacy-eye"
              onClick={() => setShowEarnings(!showEarnings)}
              title={showEarnings ? 'Ẩn số tiền' : 'Hiện số tiền'}
            >
              {showEarnings ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{showEarnings ? 'Đang hiện' : 'Đang ẩn'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1b. Tiến độ Chỉ tiêu Tháng Hiện Tại (Monthly Goal Widget) */}
      {currentMonthGoal && (currentMonthGoal.targetRevenue > 0 || currentMonthGoal.targetDays > 0) ? (
        <div className="account-goal-card">
          <div className="account-goal-card-header">
            <div className="account-goal-title-group">
              <div className="account-goal-icon-badge">
                <Target size={16} />
              </div>
              <div>
                <div className="account-goal-title">
                  Chỉ tiêu tháng {currentMonth + 1}/{currentYear}
                </div>
                <div className="account-goal-subtitle">
                  {currentMonthJobs.length} công việc đã nhận trong tháng
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-goal-nav"
              onClick={() => setActiveTab('goals')}
              title="Xem chi tiết hoặc chỉnh sửa chỉ tiêu"
            >
              <span>Xem chi tiết</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="account-goal-metrics-row">
            {/* Revenue progress */}
            <div className="account-goal-mini-stat">
              <div className="mini-stat-header">
                <span className="mini-stat-label">Doanh thu</span>
                <span
                  className={`mini-stat-pct ${
                    currentMonthGoal.targetRevenue > 0 &&
                    currentMonthEarnings >= currentMonthGoal.targetRevenue
                      ? 'complete'
                      : ''
                  }`}
                >
                  {currentMonthGoal.targetRevenue > 0
                    ? `${Math.round((currentMonthEarnings / currentMonthGoal.targetRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="mini-stat-values">
                {showEarnings
                  ? `${currentMonthEarnings.toLocaleString('vi-VN')}đ`
                  : '••••••••'}
                <span className="mini-stat-target">
                  {' '}/ {showEarnings
                    ? `${currentMonthGoal.targetRevenue.toLocaleString('vi-VN')}đ`
                    : '••••••••'}
                </span>
              </div>
              <div className="mini-goal-track">
                <div
                  className="mini-goal-fill green"
                  style={{
                    width: `${
                      currentMonthGoal.targetRevenue > 0
                        ? Math.min(
                            Math.round(
                              (currentMonthEarnings / currentMonthGoal.targetRevenue) * 100
                            ),
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Days progress */}
            <div className="account-goal-mini-stat">
              <div className="mini-stat-header">
                <span className="mini-stat-label">Ngày đi làm</span>
                <span
                  className={`mini-stat-pct ${
                    currentMonthGoal.targetDays > 0 &&
                    currentMonthWorkingDays >= currentMonthGoal.targetDays
                      ? 'complete'
                      : ''
                  }`}
                >
                  {currentMonthGoal.targetDays > 0
                    ? `${Math.round((currentMonthWorkingDays / currentMonthGoal.targetDays) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="mini-stat-values">
                {currentMonthWorkingDays}
                <span className="mini-stat-target">
                  {' '}/ {currentMonthGoal.targetDays} ngày
                </span>
              </div>
              <div className="mini-goal-track">
                <div
                  className="mini-goal-fill indigo"
                  style={{
                    width: `${
                      currentMonthGoal.targetDays > 0
                        ? Math.min(
                            Math.round(
                              (currentMonthWorkingDays / currentMonthGoal.targetDays) * 100
                            ),
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="account-empty-goal-callout">
          <div className="empty-goal-left">
            <div className="empty-goal-icon">
              <Target size={18} />
            </div>
            <div>
              <div className="empty-goal-text-title">
                Chưa đặt chỉ tiêu tháng {currentMonth + 1}/{currentYear}
              </div>
              <div className="empty-goal-text-sub">
                Đặt mục tiêu để theo dõi doanh thu và tiến độ làm việc mỗi tháng.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-set-goal-fast"
            onClick={() => setActiveTab('goals')}
          >
            <span>Đặt chỉ tiêu</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      )}

      {/* 2. Filter Tabs */}
      <div className="stats-filter-bar">
        <button
          className={`filter-pill ${timeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTimeFilter('all')}
        >
          Toàn thời gian
        </button>
        <button
          className={`filter-pill ${timeFilter === 'this_month' ? 'active' : ''}`}
          onClick={() => setTimeFilter('this_month')}
        >
          Tháng này
        </button>
        <button
          className={`filter-pill ${timeFilter === 'last_month' ? 'active' : ''}`}
          onClick={() => setTimeFilter('last_month')}
        >
          Tháng trước
        </button>
      </div>

      {/* 3. Core Metrics Grid (4 thẻ) */}
      <div className="metrics-dashboard-grid">
        {/* Thu nhập */}
        <div className="metric-box highlight-green">
          <div className="metric-box-top">
            <span className="metric-label">Tổng thu nhập</span>
            <div className="metric-icon-wrap green">
              <Wallet size={15} />
            </div>
          </div>
          <div className="metric-value green">
            {showEarnings
              ? totalFilteredEarnings > 0
                ? `${totalFilteredEarnings.toLocaleString('vi-VN')}đ`
                : '0đ'
              : '••••••••'}
          </div>
          <div className="metric-subtext">
            {timeFilter === 'all'
              ? 'Tích lũy từ trước đến nay'
              : timeFilter === 'this_month'
              ? 'Doanh thu tháng hiện tại'
              : 'Doanh thu tháng trước'}
          </div>
        </div>

        {/* Ngày đi làm */}
        <div className="metric-box">
          <div className="metric-box-top">
            <span className="metric-label">Ngày đi làm</span>
            <div className="metric-icon-wrap indigo">
              <Briefcase size={15} />
            </div>
          </div>
          <div className="metric-value indigo">
            {filteredWorkingDays} <span className="unit">ngày</span>
          </div>
          <div className="metric-subtext">Có nhận ít nhất 1 job</div>
        </div>

        {/* Tổng số việc */}
        <div className="metric-box">
          <div className="metric-box-top">
            <span className="metric-label">Tổng công việc</span>
            <div className="metric-icon-wrap cyan">
              <CalendarCheck size={15} />
            </div>
          </div>
          <div className="metric-value cyan">
            {filteredJobCount} <span className="unit">job</span>
          </div>
          <div className="metric-subtext">Đã ghi nhận trên lịch</div>
        </div>

        {/* Trung bình mỗi việc */}
        <div className="metric-box">
          <div className="metric-box-top">
            <span className="metric-label">Trung bình / Job</span>
            <div className="metric-icon-wrap amber">
              <Target size={15} />
            </div>
          </div>
          <div className="metric-value amber">
            {showEarnings
              ? averagePerJob > 0
                ? `${averagePerJob.toLocaleString('vi-VN')}đ`
                : '0đ'
              : '••••••'}
          </div>
          <div className="metric-subtext">Tiền công bình quân mỗi việc</div>
        </div>
      </div>

      {/* 4. Phân tích Thu nhập theo Tháng (Monthly Breakdown) */}
      <div className="analytics-section-card">
        <div className="section-card-header">
          <div className="section-title-wrap">
            <TrendingUp size={16} className="text-emerald" />
            <span className="section-title">Thu nhập theo từng tháng</span>
          </div>
          <span className="section-badge">{monthlyStats.length} tháng</span>
        </div>

        {monthlyStats.length === 0 ? (
          <div className="empty-section-notice">
            Chưa có công việc nào được ghi nhận.
          </div>
        ) : (
          <div className="monthly-breakdown-list">
            {monthlyStats.map((item) => {
              const monthGoal = goalsMap[item.monthKey];
              const isCurrentMonth = item.monthKey === currentMonthKey;
              const hasGoal = monthGoal && monthGoal.targetRevenue > 0;
              const isGoalAchieved = hasGoal && item.earnings >= monthGoal.targetRevenue;
              const goalPct = hasGoal ? Math.round((item.earnings / monthGoal.targetRevenue) * 100) : null;

              // Progress bar percent
              const barPercent = hasGoal
                ? Math.min((item.earnings / monthGoal.targetRevenue) * 100, 100)
                : maxMonthEarnings > 0
                ? (item.earnings / maxMonthEarnings) * 100
                : 0;

              return (
                <div key={item.monthKey} className="monthly-breakdown-item">
                  <div className="monthly-item-header">
                    <div>
                      <span className="monthly-item-name">
                        {formatMonthTitle(item.monthKey)}
                        {isCurrentMonth && <span className="current-badge">Hiện tại</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span className="monthly-item-sub">
                          {item.jobCount} job • {item.dates.size} ngày làm
                        </span>
                        {hasGoal && (
                          isGoalAchieved ? (
                            <span className="monthly-goal-tag achieved">
                              <CheckCircle2 size={11} /> Đạt chỉ tiêu ({goalPct}%)
                            </span>
                          ) : (
                            <span className="monthly-goal-tag">
                              Chỉ tiêu: {showEarnings ? `${monthGoal.targetRevenue.toLocaleString('vi-VN')}đ` : '••••••••'} ({goalPct}%)
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <div className="monthly-item-amount">
                      {showEarnings
                        ? item.earnings > 0
                          ? `${item.earnings.toLocaleString('vi-VN')}đ`
                          : '0đ'
                        : '••••••••'}
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="monthly-progress-track">
                    <div
                      className={`monthly-progress-fill ${isGoalAchieved ? 'glow' : ''}`}
                      style={{ width: `${Math.max(barPercent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* 6. Tiện ích Quản lý Dữ liệu & Đám mây */}
      <div className="analytics-section-card">
        <div className="section-card-header">
          <div className="section-title-wrap">
            <Database size={16} className="text-cyan" />
            <span className="section-title">Quản trị dữ liệu & Sao lưu</span>
          </div>
        </div>

        <div className="data-tools-grid">
          <button
            className="btn-tool-card"
            onClick={() => {
              if (typeof window !== 'undefined') {
                const isApp =
                  window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as unknown as { standalone?: boolean }).standalone === true;
                if (isApp) {
                  alert('Bạn đang sử dụng SJob ở chế độ ứng dụng độc lập (PWA)!');
                } else {
                  alert(
                    'Để cài đặt SJob vào màn hình chính:\n\n' +
                      '📱 Trên Chrome / Android: Bấm biểu tượng 3 chấm ⋮ ở góc trên trình duyệt rồi chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".\n\n' +
                      '🍏 Trên iPhone / Safari: Bấm nút Chia sẻ 📤 ở thanh dưới cùng Safari, cuộn xuống chọn "Thêm vào MH chính" (Add to Home Screen).'
                  );
                }
              }
            }}
            title="Cài đặt ứng dụng vào điện thoại"
          >
            <Smartphone size={18} className="tool-icon purple" style={{ color: '#a855f7' }} />
            <div className="tool-text">
              <div className="tool-title">Cài đặt ứng dụng (PWA)</div>
              <div className="tool-sub">Dùng mượt như app native, mở toàn màn hình & offline</div>
            </div>
          </button>

          <button
            className="btn-tool-card"
            onClick={handleExportBackup}
            title="Tải toàn bộ công việc về máy dạng file JSON"
          >
            <Download size={18} className="tool-icon cyan" />
            <div className="tool-text">
              <div className="tool-title">Xuất sao lưu (JSON)</div>
              <div className="tool-sub">Tải file về máy để cất giữ an toàn</div>
            </div>
          </button>

          {isGuest && allJobs.length > 0 && (
            <button
              className="btn-tool-card danger"
              onClick={handleClearLocalData}
              title="Xóa toàn bộ dữ liệu trên máy này"
            >
              <Trash2 size={18} className="tool-icon red" />
              <div className="tool-text">
                <div className="tool-title">Xóa dữ liệu máy</div>
                <div className="tool-sub">Xóa sạch toàn bộ lịch để làm lại</div>
              </div>
            </button>
          )}
        </div>

        {/* Cloud Connect Box (Dành cho Guest) */}
        {isGuest ? (
          <div className="account-cloud-card" style={{ marginTop: '14px' }}>
            <div className="cloud-card-info">
              <div className="cloud-card-title">
                <Cloud size={16} />
                <span>Đồng bộ nhiều thiết bị</span>
              </div>
              <p className="cloud-card-desc">
                Đăng nhập tài khoản Google để đưa toàn bộ lịch lên đám mây, giúp bạn xem và chỉnh sửa được trên máy tính hoặc điện thoại khác.
              </p>
            </div>

            <button className="btn-google-connect" onClick={handleGoogleClick}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Kết nối Google</span>
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '14px' }}>
            <button
              className="btn-secondary"
              onClick={logout}
              style={{
                color: 'var(--accent-rose)',
                borderColor: 'rgba(244, 63, 94, 0.25)',
                width: '100%',
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất tài khoản Google</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
