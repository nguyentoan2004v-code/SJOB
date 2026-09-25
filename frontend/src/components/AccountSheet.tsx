'use client';

import React, { useState, useEffect } from 'react';
import { useJobs } from '../context/JobContext';
import { clearGuestJobs } from '../lib/storage';
import {
  X,
  ShieldCheck,
  Cloud,
  LogOut,
  Database,
  Download,
  Edit2,
  Trash2,
  CalendarCheck,
  Save,
} from 'lucide-react';

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSheet: React.FC<AccountSheetProps> = ({ isOpen, onClose }) => {
  const { user, isGuest, logout, loginWithGoogle, allJobs } = useJobs();
  const [guestName, setGuestName] = useState<string>('Freelancer');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sjob_guest_name');
      if (stored) {
        setGuestName(stored);
      }
    }
  }, []);

  if (!isOpen) return null;

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
    onClose();
  };

  const totalEarnings = allJobs.reduce((sum, j) => sum + (Number(j.cost) || 0), 0);

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle" />

        <div className="sheet-header">
          <span className="sheet-title">Tài khoản & Dữ liệu</span>
          <button className="close-btn" onClick={onClose} title="Đóng">
            <X size={18} />
          </button>
        </div>

        {/* 1. Main Profile Card */}
        <div className="account-profile-card">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="Avatar" className="account-avatar-img" />
          ) : (
            <div className="account-avatar">
              {isGuest
                ? guestName ? guestName[0].toUpperCase() : 'F'
                : user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}

          <div className="account-info">
            <div className="account-name-group">
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
                  <span className="account-name-text">
                    {isGuest ? guestName : user?.name || user?.email}
                  </span>
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

            <div className={`account-badge-pill ${isGuest ? 'guest' : 'cloud'}`}>
              {isGuest ? (
                <>
                  <ShieldCheck size={13} />
                  <span>Bản máy (Offline-ready)</span>
                </>
              ) : (
                <>
                  <Cloud size={13} />
                  <span>Đã đồng bộ Đám mây</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Quick Overview Stats */}
        <div className="account-stats-grid">
          <div className="account-stat-box">
            <span className="title">Công việc đã lưu</span>
            <span className="value">
              <CalendarCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
              {allJobs.length} job
            </span>
          </div>
          <div className="account-stat-box">
            <span className="title">Tổng tiền công</span>
            <span className="value green">
              {totalEarnings > 0 ? `${totalEarnings.toLocaleString('vi-VN')}đ` : '0đ'}
            </span>
          </div>
        </div>

        {/* 3. Data Utilities (Sao lưu / Xóa dữ liệu) */}
        <div className="account-action-card">
          <div className="action-card-header">
            <Database size={15} className="text-cyan" />
            <span className="action-card-title">Quản lý dữ liệu máy</span>
          </div>

          <div className="action-card-buttons">
            <button
              className="btn-outline-action"
              onClick={handleExportBackup}
              title="Tải file sao lưu về máy"
            >
              <Download size={14} />
              <span>Xuất sao lưu (JSON)</span>
            </button>

            {isGuest && allJobs.length > 0 && (
              <button
                className="btn-outline-action danger"
                onClick={handleClearLocalData}
                title="Xóa toàn bộ dữ liệu trên máy này"
              >
                <Trash2 size={14} />
                <span>Xóa dữ liệu máy</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Cloud Connect / Sync Card (Tùy chọn) */}
        {isGuest ? (
          <div className="account-cloud-card">
            <div className="cloud-card-info">
              <div className="cloud-card-title">
                <Cloud size={16} />
                <span>Đồng bộ nhiều thiết bị</span>
              </div>
              <p className="cloud-card-desc">
                Đăng nhập Google để lưu công việc lên máy chủ và truy cập từ máy tính hoặc điện thoại khác.
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
          <div style={{ marginTop: '16px' }}>
            <button
              className="btn-secondary"
              onClick={() => {
                logout();
                onClose();
              }}
              style={{
                color: 'var(--accent-rose)',
                borderColor: 'rgba(244, 63, 94, 0.25)',
                width: '100%',
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
