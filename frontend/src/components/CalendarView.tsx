'use client';

import React, { useState } from 'react';
import { useJobs, getTodayDateString } from '../context/JobContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Edit3,
  Trash2,
  CalendarCheck,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  CalendarDays,
  Wallet,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  CircleCheck,
  CircleDashed,
  Check,
} from 'lucide-react';
import { Job } from '../types/job';

const WEEKDAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAYS_FULL = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export const CalendarView: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    allJobs,
    openCreateSheet,
    openEditSheet,
    toggleJobPaid,
    deleteJob,
  } = useJobs();

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentPivot, setCurrentPivot] = useState<Date>(new Date(selectedDate));
  // Mặc định luôn ở trạng thái tắt (ẩn doanh thu để bảo mật)
  const [showEarnings, setShowEarnings] = useState<boolean>(false);

  const toggleShowEarnings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEarnings((prev) => !prev);
  };

  const todayKey = getTodayDateString();

  const formatDateKey = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group jobs by date
  const jobsByDate = allJobs.reduce((acc, job) => {
    if (!acc[job.date]) acc[job.date] = [];
    acc[job.date].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  // Generate 7 days for the current week (Starting on Monday)
  const getDaysInCurrentWeek = () => {
    const days: Date[] = [];
    const pivot = new Date(currentPivot);
    const dayOfWeek = pivot.getDay(); // 0 is Sunday, 1 is Monday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() - distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const currentWeekDays = getDaysInCurrentWeek();
  const startOfWeek = currentWeekDays[0];
  const endOfWeek = currentWeekDays[6];

  // Monthly stats for currentPivot month
  const currentYear = currentPivot.getFullYear();
  const currentMonth = currentPivot.getMonth();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const daysInCurrentMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();

  const currentMonthJobs = allJobs.filter((j) => j.date.startsWith(currentMonthPrefix));
  const totalMonthEarnings = currentMonthJobs.reduce(
    (sum, j) => sum + (Number(j.cost) || 0),
    0
  );
  const workingDaysInMonthSet = new Set(currentMonthJobs.map((j) => j.date));
  const totalWorkingDaysInMonth = workingDaysInMonthSet.size;
  const totalOffDaysInMonth = Math.max(0, daysInCurrentMonthCount - totalWorkingDaysInMonth);
  const totalMonthJobs = currentMonthJobs.length;

  // Month grid generator
  const getDaysInCurrentMonth = () => {
    const year = currentPivot.getFullYear();
    const month = currentPivot.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    let startDay = (firstDay.getDay() + 6) % 7;

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }
    return days;
  };

  const handlePrev = () => {
    const nextPivot = new Date(currentPivot);
    if (viewMode === 'month') {
      nextPivot.setMonth(nextPivot.getMonth() - 1);
    } else {
      nextPivot.setDate(nextPivot.getDate() - 7);
    }
    setCurrentPivot(nextPivot);
  };

  const handleNext = () => {
    const nextPivot = new Date(currentPivot);
    if (viewMode === 'month') {
      nextPivot.setMonth(nextPivot.getMonth() + 1);
    } else {
      nextPivot.setDate(nextPivot.getDate() + 7);
    }
    setCurrentPivot(nextPivot);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentPivot(now);
    setSelectedDate(formatDateKey(now));
  };

  const handleDeleteJob = async (job: Job) => {
    if (confirm(`Bạn có chắc muốn xoá công việc "${job.title}" không?`)) {
      await deleteJob(job.id);
    }
  };

  // Details for currently selected date
  const selectedDateObj = new Date(selectedDate);
  const selectedDayJobs = (jobsByDate[selectedDate] || []).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  const isSelectedDateFree = selectedDayJobs.length === 0;
  const isSelectedDateToday = selectedDate === todayKey;

  const formattedSelectedDateTitle = `${WEEKDAYS_FULL[selectedDateObj.getDay()]}, ${selectedDateObj.getDate()} tháng ${selectedDateObj.getMonth() + 1}`;

  return (
    <div className="pro-calendar-container">
      {/* 1. Week Bar Controller */}
      <div className="calendar-nav-bar">
        <div className="nav-controls">
          <button className="nav-arrow-btn" onClick={handlePrev} title="Trước">
            <ChevronLeft size={16} />
          </button>
          <div className="nav-title">
            {viewMode === 'month'
              ? `Tháng ${currentPivot.getMonth() + 1}, ${currentPivot.getFullYear()}`
              : `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`}
          </div>
          <button className="nav-arrow-btn" onClick={handleNext} title="Sau">
            <ChevronRight size={16} />
          </button>

          <button className="btn-today-pill" onClick={handleJumpToToday}>
            Hôm nay
          </button>
        </div>

        <div className="calendar-mode-toggle">
          <button
            className={`mode-toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Tuần
          </button>
          <button
            className={`mode-toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* 2. Top Week Strip (7 Columns Evenly Distributed) */}
      {viewMode === 'week' ? (
        <>
          <div className="week-strip-grid">
            {currentWeekDays.map((d) => {
              const dateKey = formatDateKey(d);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;
              const jobs = jobsByDate[dateKey] || [];
              const hasJobs = jobs.length > 0;
              const dayIndex = (d.getDay() + 6) % 7; // Monday = 0
              const dayLabel = WEEKDAYS_SHORT[dayIndex];

              return (
                <div
                  key={dateKey}
                  className={`week-day-col ${isSelected ? 'selected' : ''} ${
                    isToday ? 'today' : ''
                  }`}
                  onClick={() => {
                    setSelectedDate(dateKey);
                    setCurrentPivot(d);
                  }}
                >
                  <span className="col-weekday">{dayLabel}</span>
                  <span className="col-daynum">{d.getDate()}</span>

                  {/* Status Indicator */}
                  <div className="col-indicator-slot">
                    {hasJobs ? (
                      <span className="job-badge-pill">{jobs.length}</span>
                    ) : (
                      <span className="free-dot" title="Còn trống" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Detailed Selected Day Timeline Canvas */}
          <div className="selected-day-canvas">
            {/* Header of the Selected Day */}
            <div className="day-canvas-header">
              <div>
                <div className="day-canvas-title">
                  {formattedSelectedDateTitle}
                  {isSelectedDateToday && <span className="today-chip">Hôm nay</span>}
                </div>
                <div className="day-canvas-sub">
                  {isSelectedDateFree
                    ? '🟢 Trống lịch cả ngày — Sẵn sàng nhận việc'
                    : `🟣 Đã xếp ${selectedDayJobs.length} công việc trong ngày`}
                </div>
              </div>

              <button
                className="btn-add-job-header"
                onClick={() => openCreateSheet(selectedDate)}
              >
                <Plus size={16} />
                <span>Thêm job</span>
              </button>
            </div>

            {/* If the day is FREE: Clean, motivating suggestions instead of a big empty wall */}
            {isSelectedDateFree ? (
              <div className="free-day-card">
                <div className="free-card-content">
                  <div className="free-icon-badge">
                    <CalendarCheck size={28} />
                  </div>
                  <h4>Ngày này đang hoàn toàn trống!</h4>
                  <p>
                    Bạn chưa nhận lịch hẹn nào vào ngày này. Chọn nhanh khung giờ rảnh để nhận việc:
                  </p>

                  {/* Preset Quick Time Slots */}
                  <div className="preset-slots-row">
                    <button
                      className="preset-slot-btn"
                      onClick={() => openCreateSheet(selectedDate)}
                    >
                      <Sunrise size={16} className="preset-icon morning" />
                      <div>
                        <div className="preset-name">Sáng</div>
                        <div className="preset-time">08:00 - 12:00</div>
                      </div>
                    </button>

                    <button
                      className="preset-slot-btn"
                      onClick={() => openCreateSheet(selectedDate)}
                    >
                      <Sun size={16} className="preset-icon afternoon" />
                      <div>
                        <div className="preset-name">Chiều</div>
                        <div className="preset-time">13:30 - 17:30</div>
                      </div>
                    </button>

                    <button
                      className="preset-slot-btn"
                      onClick={() => openCreateSheet(selectedDate)}
                    >
                      <Moon size={16} className="preset-icon evening" />
                      <div>
                        <div className="preset-name">Tối</div>
                        <div className="preset-time">18:00 - 21:00</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* If the day HAS JOBS: Pro Timeline Cards */
              <div className="day-timeline-list">
                {selectedDayJobs.map((job) => (
                  <div key={job.id} className="pro-job-card">
                    <div className="job-card-indicator" />
                    <div className="job-card-inner">
                      <div className="job-card-header">
                        <div className="job-main-title">{job.title}</div>
                        <div className="job-action-buttons">
                          <button
                            className="btn-icon-soft"
                            title="Sửa"
                            onClick={() => openEditSheet(job)}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="btn-icon-soft delete"
                            title="Xoá"
                            onClick={() => handleDeleteJob(job)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="job-card-meta">
                        <div className="job-time-badge">
                          <Clock size={11} />
                          <span>
                            {job.startTime} — {job.endTime}
                          </span>
                        </div>

                        {job.cost != null && job.cost > 0 && (
                          <div className="job-cost-badge">
                            💰 {showEarnings ? `${Number(job.cost).toLocaleString('vi-VN')}đ` : '••••••'}
                          </div>
                        )}

                        {/* Paid status toggle button - tap to toggle directly */}
                        <button
                          type="button"
                          className={`job-paid-badge ${job.paid ? 'paid' : 'unpaid'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleJobPaid(job);
                          }}
                          title={
                            job.paid
                              ? 'Đã trả tiền (Bấm vào đây để đổi sang Chưa trả)'
                              : 'Chưa trả tiền (Bấm vào đây để đổi sang Đã trả)'
                          }
                        >
                          {job.paid ? <CircleCheck size={11} /> : <CircleDashed size={11} />}
                          <span>{job.paid ? 'Đã trả tiền' : 'Chưa trả tiền'}</span>
                        </button>
                      </div>

                      {job.note && <div className="job-main-note">{job.note}</div>}
                    </div>
                  </div>
                ))}

                <button
                  className="btn-add-more-job"
                  onClick={() => openCreateSheet(selectedDate)}
                >
                  <Plus size={15} />
                  <span>Xếp thêm công việc khác vào ngày này</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* MONTH VIEW */
        <div className="month-calendar-wrap">
          {/* Monthly Stats Dashboard Card */}
          <div className="month-stats-card">
            <div className="month-stat-box">
              <div className="stat-box-header">
                <Wallet size={13} className="stat-box-icon green" />
                <span className="stat-box-label">Thu nhập</span>
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={toggleShowEarnings}
                  title={showEarnings ? 'Ẩn số tiền' : 'Hiện số tiền'}
                >
                  {showEarnings ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
              <div className="stat-box-value green">
                {showEarnings
                  ? totalMonthEarnings > 0
                    ? `${totalMonthEarnings.toLocaleString('vi-VN')}đ`
                    : '0đ'
                  : '••••••••'}
              </div>
            </div>

            <div className="month-stat-divider" />

            <div className="month-stat-box">
              <div className="stat-box-header">
                <Briefcase size={13} className="stat-box-icon indigo" />
                <span className="stat-box-label">Ngày làm</span>
              </div>
              <div className="stat-box-value indigo">
                {totalWorkingDaysInMonth}{' '}
                <span className="stat-box-unit">/ {daysInCurrentMonthCount}</span>
              </div>
            </div>

            <div className="month-stat-divider" />

            <div className="month-stat-box">
              <div className="stat-box-header">
                <CheckCircle2 size={13} className="stat-box-icon amber" />
                <span className="stat-box-label">Số việc</span>
              </div>
              <div className="stat-box-value amber">
                {totalMonthJobs} <span className="stat-box-unit">job</span>
              </div>
            </div>
          </div>

          {/* Color Legend (Chú thích màu sắc ngày làm / ngày nghỉ / trạng thái trả tiền) */}
          {/* Color Legend (Chú thích màu sắc ngày làm / ngày nghỉ & đã trả tiền) */}
          <div className="month-color-legend">
            <div className="legend-item">
              <span className="legend-indicator green"></span>
              <span>
                Đi làm: <strong>{totalWorkingDaysInMonth}</strong> ngày
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-indicator red"></span>
              <span>
                Nghỉ: <strong>{totalOffDaysInMonth}</strong> ngày
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-check-icon">
                <Check size={10} strokeWidth={3.5} />
              </span>
              <span>Đã trả tiền</span>
            </div>
          </div>

          <div className="month-grid">
            {WEEKDAYS_SHORT.map((w, idx) => (
              <div key={idx} className="month-weekday-header">
                {w}
              </div>
            ))}
            {getDaysInCurrentMonth().map((item, idx) => {
              const dateKey = formatDateKey(item.date);
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;
              const jobs = jobsByDate[dateKey] || [];
              const hasJobs = jobs.length > 0;
              const allPaid = hasJobs && jobs.every((j) => j.paid);
              const somePaid = hasJobs && jobs.some((j) => j.paid) && !allPaid;

              return (
                <div
                  key={idx}
                  className={`month-cell ${!item.isCurrentMonth ? 'empty' : ''} ${
                    isSelected ? 'selected' : ''
                  } ${isToday ? 'today' : ''} ${
                    item.isCurrentMonth && hasJobs ? 'has-jobs' : ''
                  } ${item.isCurrentMonth && !hasJobs ? 'no-jobs' : ''}`}
                  onClick={() => {
                    if (item.isCurrentMonth) {
                      setSelectedDate(dateKey);
                      setCurrentPivot(item.date);
                      setViewMode('week');
                    }
                  }}
                >
                  {/* Tích xanh nhỏ ở trong ô khi đã trả tiền */}
                  {item.isCurrentMonth && hasJobs && (allPaid || somePaid) && (
                    <span
                      className={`month-paid-check ${somePaid ? 'some-paid' : ''}`}
                      title={allPaid ? 'Đã trả tiền' : 'Đã trả 1 phần'}
                    >
                      <Check size={9} strokeWidth={3.5} />
                    </span>
                  )}
                  <span className="month-day-num">{item.date.getDate()}</span>
                  {hasJobs && item.isCurrentMonth && (
                    <span className="month-job-dot" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
