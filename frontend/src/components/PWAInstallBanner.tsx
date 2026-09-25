'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode (already installed as PWA)
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isApp);

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('sjob_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    // Listen for beforeinstallprompt (Android, Chrome, Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sjob_pwa_dismissed', 'true');
    }
  };

  // If already running as installed app or dismissed, don't show
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show if prompt is available (Android/Desktop) or on iOS Safari
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  return (
    <div className="pwa-install-banner">
      <div className="pwa-banner-left">
        <div className="pwa-banner-icon">
          <Smartphone size={18} />
        </div>
        <div className="pwa-banner-text">
          <div className="pwa-banner-title">Cài đặt ứng dụng SJob</div>
          <div className="pwa-banner-sub">
            {isIOS
              ? 'Thêm vào màn hình chính iPhone để dùng như app'
              : 'Dùng nhanh 1-chạm, toàn màn hình và hỗ trợ offline'}
          </div>
        </div>
      </div>

      <div className="pwa-banner-actions">
        <button
          type="button"
          className="btn-pwa-install"
          onClick={handleInstallClick}
        >
          <Download size={13} />
          <span>{isIOS ? 'Hướng dẫn' : 'Cài đặt'}</span>
        </button>

        <button
          type="button"
          className="btn-pwa-dismiss"
          onClick={handleDismiss}
          title="Đóng thông báo"
        >
          <X size={14} />
        </button>
      </div>

      {/* iOS Safari Guide Modal / Popover */}
      {showIOSGuide && (
        <div className="ios-pwa-guide-overlay" onClick={() => setShowIOSGuide(false)}>
          <div className="ios-pwa-guide-card" onClick={(e) => e.stopPropagation()}>
            <div className="ios-guide-header">
              <span className="ios-guide-title">Cài đặt SJob trên iPhone / iPad</span>
              <button
                type="button"
                className="ios-guide-close"
                onClick={() => setShowIOSGuide(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ios-guide-steps">
              <div className="ios-step-item">
                <span className="step-num">1</span>
                <span>
                  Bấm vào nút <strong>Chia sẻ (Share)</strong> <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> ở thanh dưới cùng của Safari.
                </span>
              </div>
              <div className="ios-step-item">
                <span className="step-num">2</span>
                <span>
                  Cuộn xuống và chọn <strong>&quot;Thêm vào MH chính&quot; (Add to Home Screen)</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />.
                </span>
              </div>
              <div className="ios-step-item">
                <span className="step-num">3</span>
                <span>
                  Bấm <strong>&quot;Thêm&quot; (Add)</strong> ở góc trên bên phải. SJob sẽ xuất hiện trên màn hình điện thoại như ứng dụng tải từ App Store!
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', marginTop: '12px', padding: '10px' }}
              onClick={() => setShowIOSGuide(false)}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
