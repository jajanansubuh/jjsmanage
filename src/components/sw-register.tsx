'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Disable service worker in development to avoid caching issues with hot reloading
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV !== 'true') {
      console.log('SW registration is disabled in development mode.');
      return;
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // every hour
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }
  }, []);

  return null;
}
