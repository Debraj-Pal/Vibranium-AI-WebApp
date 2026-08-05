import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFirebaseWithConfig } from './lib/firebase';
import { getApiUrl } from './lib/api';

async function bootstrap() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(getApiUrl('/api/firebase-config'), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const config = await res.json();
      await initFirebaseWithConfig(config);
    }
  } catch (err) {
    console.warn("[Firebase] Failed to fetch runtime Firebase config, falling back to static defaults:", err);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Register PWA Service Worker for offline support & caching
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
    });
  }
}

bootstrap();

