import type { Metadata, Viewport } from 'next';
import './globals.css';
import { JobProvider } from '../context/JobContext';
import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'SJob — Lịch Nhận Job Cho Freelancer',
  description: 'Quản lý lịch nhận job hàng ngày và cảnh báo trùng giờ thông minh cho người làm tự do',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SJob',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <JobProvider>
          <ServiceWorkerRegister />
          <div className="viewport-wrapper">
            <div className="mobile-shell">
              {children}
            </div>
          </div>
        </JobProvider>
      </body>
    </html>
  );
}
