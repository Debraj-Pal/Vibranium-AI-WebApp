import { Capacitor } from '@capacitor/core';

/**
 * Live fallback backend server URL for external deployments and native mobile containers
 */
const FALLBACK_BACKEND_URL = 'https://vibranium-ai-349153338672.us-west1.run.app';

/**
 * Dynamically resolves the API endpoint URL depending on the runtime platform.
 * If running on Cloud Run, AI Studio preview, or local dev server (port 3000/5173), relative paths are used.
 * For Capacitor Android/iOS Native apps or Vercel deployments, requests are routed to the live backend server.
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Custom server override if declared
  const customServer = (import.meta as any).env?.VITE_API_SERVER_URL;
  if (customServer && typeof customServer === 'string') {
    const cleanServer = customServer.endsWith('/') ? customServer.slice(0, -1) : customServer;
    return `${cleanServer}${cleanEndpoint}`;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Detect Capacitor Native Container or Native protocols (Android/iOS APK)
  const isNativeMobile = 
    Capacitor.isNativePlatform() ||
    origin.startsWith('capacitor:') ||
    origin.startsWith('file:') ||
    (origin.includes('localhost') && !origin.includes(':3000') && !origin.includes(':5173') && !origin.includes(':3001'));

  if (isNativeMobile) {
    return `${FALLBACK_BACKEND_URL}${cleanEndpoint}`;
  }

  // Web environments (Vercel, Cloud Run, AI Studio, local preview, custom domains)
  // use relative same-origin routes directly.
  return cleanEndpoint;
}

/**
 * Returns a valid public HTTP origin for generating shareable chat links across Web & Mobile apps.
 */
export function getPublicOrigin(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalOrNative = 
    !origin || 
    Capacitor.isNativePlatform() ||
    origin.startsWith('capacitor:') || 
    origin.startsWith('file:') || 
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  if (isLocalOrNative) {
    return FALLBACK_BACKEND_URL;
  }
  return origin;
}

