import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFirebaseWithConfig } from './lib/firebase';

async function bootstrap() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('/api/firebase-config', { signal: controller.signal });
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
}

bootstrap();

