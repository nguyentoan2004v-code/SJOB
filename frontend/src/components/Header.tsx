'use client';

import React, { useState, useEffect } from 'react';
import { useJobs } from '../context/JobContext';
import { ShieldCheck, LogOut, Cloud, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isGuest, logout, openGoogleModal, setActiveTab } = useJobs();
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalonePWA =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandalonePWA);
    }
  }, []);

  const handleGoogleClick = () => {
    openGoogleModal();
  };

  return (
    <header className={`app-header ${isStandalone ? 'standalone-header' : ''}`}>
      <div
        className="logo-group"
        onClick={() => setActiveTab('calendar')}
        title="Về trang chủ Lịch"
        style={{ cursor: 'pointer' }}
      >
        <div className="logo-badge">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/emblem-white.png" alt="SJob" className="logo-badge-img" />
        </div>
        <div className="logo-text">
          <div className="logo-title">SJob</div>
          <div className="logo-subtitle">Lịch Freelancer</div>
        </div>
      </div>

      <div className="header-actions">
        {isGuest ? (
          <>
            <div className="status-pill-offline" title="Lưu vĩnh viễn trên máy của bạn">
              <span className="pulse-dot"></span>
              <span>Bản máy</span>
            </div>
            <button
              className="btn-google-auth"
              onClick={handleGoogleClick}
              title="Đăng nhập Google để lưu trữ đám mây & xem trên nhiều thiết bị"
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
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
              <span>Đăng nhập Google</span>
            </button>
          </>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="user-profile-btn"
              onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="User" className="user-avatar" />
              ) : (
                <div className="user-avatar">{user?.name ? user.name[0] : 'U'}</div>
              )}
              <span className="user-name">{user?.name || user?.email}</span>
            </button>

            {isAuthMenuOpen && (
              <div className="auth-dropdown-menu">
                <div className="auth-dropdown-email">{user?.email}</div>
                <button
                  className="auth-dropdown-logout"
                  onClick={() => {
                    setIsAuthMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut size={14} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
