'use client';

import React, { useState, useEffect } from 'react';
import { useJobs } from '../context/JobContext';
import { X, AlertTriangle, Check, DollarSign } from 'lucide-react';
import { Job, OverlapCheckResult } from '../types/job';

export const JobFormSheet: React.FC = () => {
  const { isSheetOpen, closeSheet, editingJob, selectedDate, saveJob, checkOverlap } = useJobs();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [overlapResult, setOverlapResult] = useState<OverlapCheckResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync form state when opening or switching job
  useEffect(() => {
    if (isSheetOpen) {
      if (editingJob) {
        setTitle(editingJob.title);
        setDate(editingJob.date);
        setStartTime(editingJob.startTime);
        setEndTime(editingJob.endTime);
        setNote(editingJob.note || '');
        setCost(editingJob.cost != null ? String(editingJob.cost) : '');
      } else {
        setTitle('');
        setDate(selectedDate);
        setStartTime('09:00');
        setEndTime('11:00');
        setNote('');
        setCost('');
      }
      setOverlapResult(null);
      setFormError(null);
    }
  }, [isSheetOpen, editingJob, selectedDate]);

  // Real-time overlap check debounce
  useEffect(() => {
    if (!isSheetOpen || !date || !startTime || !endTime) return;

    if (startTime >= endTime) {
      setOverlapResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkOverlap(date, startTime, endTime, editingJob?.id);
        setOverlapResult(res);
      } catch (err) {
        console.error('Overlap check error:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isSheetOpen, date, startTime, endTime, editingJob, checkOverlap]);

  if (!isSheetOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Vui lòng nhập tên công việc');
      return;
    }

    if (startTime >= endTime) {
      setFormError('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveJob({
        title: title.trim(),
        date,
        startTime,
        endTime,
        note: note.trim() || undefined,
        cost: cost ? Number(cost) : undefined,
        paid: editingJob?.paid ?? false,
      });
    } catch (err: any) {
      setFormError(err.message || 'Không thể lưu công việc');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bottom-sheet-backdrop" onClick={closeSheet}>
      <div
        className="bottom-sheet-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drag-handle" />

        <div className="sheet-header">
          <span className="sheet-title">
            {editingJob ? 'Sửa công việc' : 'Thêm công việc mới'}
          </span>
          <button className="close-btn" onClick={closeSheet}>
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tên công việc */}
          <div className="form-group">
            <label className="form-label">Tên / Loại công việc *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Sửa điện nhà A.Hải, Dạy kèm Toán..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Ngày làm việc */}
          <div className="form-group">
            <label className="form-label">Ngày nhận việc *</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Khung giờ: Bắt đầu & Kết thúc */}
          <div className="form-group">
            <label className="form-label">Khung giờ làm việc *</label>
            <div className="time-row">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', display: 'block', marginBottom: '4px' }}>
                  Giờ bắt đầu
                </span>
                <input
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', display: 'block', marginBottom: '4px' }}>
                  Giờ kết thúc
                </span>
                <input
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Inline Cảnh báo Trùng Giờ (Overlap Warning) */}
          {overlapResult?.hasOverlap && (
            <div className="overlap-warning-box">
              <div className="overlap-header">
                <AlertTriangle size={17} />
                <span>Cảnh báo: Trùng giờ với việc khác!</span>
              </div>
              <div className="overlap-items">
                {overlapResult.overlappingJobs.map((ovJob: Job) => (
                  <div key={ovJob.id} className="overlap-item">
                    • <strong>{ovJob.title}</strong> ({ovJob.startTime} - {ovJob.endTime})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiền công */}
          <div className="form-group">
            <label className="form-label">Tiền công (VNĐ)</label>
            <div className="cost-input-wrapper">
              <DollarSign size={16} className="cost-input-icon" />
              <input
                type="number"
                className="form-input cost-input"
                placeholder="VD: 500000"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                min="0"
                inputMode="numeric"
              />
              {cost && (
                <span className="cost-preview">
                  {Number(cost).toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
          </div>


          {/* Ghi chú thêm */}
          <div className="form-group">
            <label className="form-label">Ghi chú (Địa chỉ, số điện thoại, ghi nhớ...)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="VD: Mang theo thang nhôm, số nhà 45 Lê Lợi..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Nút lưu */}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            <Check size={20} />
            <span>{isSubmitting ? 'Đang lưu...' : editingJob ? 'Cập nhật công việc' : 'Thêm vào lịch'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
