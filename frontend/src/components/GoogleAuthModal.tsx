'use client';

import React, { useEffect, useState } from 'react';
import { useJobs } from '../context/JobContext';
import { X, Cloud, Smartphone, Sparkles, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '257067138162-fnaf04q43i1gqcdg5nk833g907ep2t2m.apps.googleusercontent.com';

export const GoogleAuthModal: React.FC = () => {
  const { isGoogleModalOpen, closeGoogleModal, loginWithGoogle } = useJobs();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!isGoogleModalOpen) return;

    let retryCount = 0;
    const maxRetries = 25; // 25 * 200ms = 5s

    const setupGoogle = () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        setIsSdkLoaded(true);

        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (response.credential) {
              setIsSubmitting(true);
              try {
                await loginWithGoogle(response.credential);
              } finally {
                setIsSubmitting(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official Google button
        const slot = document.getElementById('google-btn-slot');
        if (slot) {
          slot.innerHTML = '';
          window.google.accounts.id.renderButton(slot, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 270,
            logo_alignment: 'left',
          });
        }

        // Trigger One Tap if supported
        try {
          window.google.accounts.id.prompt();
        } catch {
          // Ignore One Tap suppression
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(setupGoogle, 200);
      }
    };

    setupGoogle();

    return () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [isGoogleModalOpen, loginWithGoogle]);

  if (!isGoogleModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={closeGoogleModal}>
      <div
        className="modal-dialog google-auth-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 390 }}
      >
        <button
          className="modal-close-btn"
          onClick={closeGoogleModal}
          title="Đóng"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="modal-icon-badge google-badge">
          <svg width="28" height="28" viewBox="0 0 24 24">
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
        </div>

        <div className="modal-title" style={{ fontSize: '18px', marginBottom: '6px' }}>
          Đăng nhập Google Cloud
        </div>

        <div className="modal-desc" style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '18px' }}>
          Đăng nhập hoặc tạo tài khoản SJob mới bằng tài khoản Gmail của bạn để lưu trữ đám mây an toàn.
        </div>

        {/* Benefits list */}
        <div className="google-benefits-box">
          <div className="google-benefit-item">
            <Cloud size={16} className="benefit-icon" />
            <span>Lưu vĩnh viễn trên cơ sở dữ liệu Cloud TiDB</span>
          </div>
          <div className="google-benefit-item">
            <Smartphone size={16} className="benefit-icon" />
            <span>Đồng bộ tức thì giữa điện thoại và máy tính</span>
          </div>
          <div className="google-benefit-item">
            <Sparkles size={16} className="benefit-icon" />
            <span>Tự động nhận diện công việc đã tạo trước đó</span>
          </div>
        </div>

        {/* Google Render Slot */}
        <div className="google-btn-wrapper">
          {isSubmitting ? (
            <div className="google-btn-loading">
              <Loader2 size={18} className="spin-animate" />
              <span>Đang kết nối tài khoản Google...</span>
            </div>
          ) : (
            <div id="google-btn-slot" className="google-btn-slot">
              {!isSdkLoaded && (
                <div className="google-btn-loading">
                  <Loader2 size={16} className="spin-animate" />
                  <span>Đang tải nút Google...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="google-modal-footer">
          Bằng việc đăng nhập, bạn đồng ý sử dụng SJob để quản lý lịch cá nhân hoàn toàn miễn phí.
        </div>
      </div>
    </div>
  );
};
