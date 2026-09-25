'use client';

import React from 'react';
import { useJobs } from '../context/JobContext';
import { Clock, Edit3, Trash2, CalendarPlus, Briefcase, CircleCheck, CircleDashed } from 'lucide-react';
import { Job } from '../types/job';

const WEEKDAYS_FULL = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export const DayJobsList: React.FC = () => {
  const {
    selectedDate,
    jobsForSelectedDate,
    openEditSheet,
    deleteJob,
    openCreateSheet,
    toggleJobPaid,
  } = useJobs();

  // Friendly date label
  const formatDateTitle = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();

    const isToday =
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate();

    const weekday = WEEKDAYS_FULL[dateObj.getDay()];
    const dateFormatted = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;

    if (isToday) {
      return `Hôm nay, ${dateFormatted}`;
    }
    return `${weekday}, ${dateFormatted}`;
  };

  const handleDelete = async (job: Job) => {
    if (confirm(`Bạn có chắc muốn xoá công việc "${job.title}" không?`)) {
      await deleteJob(job.id);
    }
  };

  return (
    <div>
      <div className="day-section-header">
        <div className="day-section-title">
          <span>{formatDateTitle(selectedDate)}</span>
          <span className="job-count-badge">{jobsForSelectedDate.length} việc</span>
        </div>
      </div>

      {jobsForSelectedDate.length === 0 ? (
        <div className="empty-jobs-state">
          <div className="empty-icon-wrap">
            <Briefcase size={26} />
          </div>
          <div className="empty-title">Chưa có lịch nhận job</div>
          <div className="empty-desc">
            Ngày này bạn chưa có công việc nào. Hãy thêm để tránh nhận trùng giờ!
          </div>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 20px', minHeight: '42px', marginTop: '6px' }}
            onClick={() => openCreateSheet(selectedDate)}
          >
            <CalendarPlus size={18} />
            <span>Thêm công việc</span>
          </button>
        </div>
      ) : (
        <div className="jobs-list">
          {jobsForSelectedDate.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-card-accent-bar" />
              <div className="job-card-top">
                <div className="job-time-tag">
                  <Clock size={14} />
                  <span>
                    {job.startTime} - {job.endTime}
                  </span>
                </div>
                <div className="job-actions">
                  <button
                    className="action-icon-btn"
                    title="Chỉnh sửa công việc"
                    onClick={() => openEditSheet(job)}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    className="action-icon-btn delete"
                    title="Xoá công việc"
                    onClick={() => handleDelete(job)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="job-title">{job.title}</div>

              {/* Paid status button */}
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
                {job.paid ? <CircleCheck size={13} /> : <CircleDashed size={13} />}
                <span>{job.paid ? 'Đã trả tiền' : 'Chưa trả tiền'}</span>
              </button>

              {job.note && <div className="job-note">{job.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
