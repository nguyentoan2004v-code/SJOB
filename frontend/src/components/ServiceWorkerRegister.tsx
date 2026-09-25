'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] ServiceWorker registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('[SW] ServiceWorker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
};
