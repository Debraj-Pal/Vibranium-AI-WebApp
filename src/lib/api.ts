import { Capacitor } from '@capacitor/core';

/**
 * Live fallback backend server URL for external deployments and native mobile containers
 */
const FALLBACK_BACKEND_URL = 'https://vibranium-ai-349153338672.us-west1.run.app';

/**
 * Resolves the primary API endpoint URL.
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
  
  // Detect Capacitor Native Container or file protocols
  const isNativeMobile = 
    Capacitor.isNativePlatform() ||
    origin.startsWith('capacitor:') ||
    origin.startsWith('file:');

  if (isNativeMobile) {
    return `${FALLBACK_BACKEND_URL}${cleanEndpoint}`;
  }

  // If hosted on Vercel without a configured custom backend, use relative path
  return cleanEndpoint;
}

/**
 * Safe fetch wrapper that tries same-origin API first, and seamlessly falls back
 * to the high-availability Cloud Run backend if Vercel serverless fails or is unconfigured.
 */
export async function safeApiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const primaryUrl = getApiUrl(cleanEndpoint);

  try {
    const res = await fetch(primaryUrl, options);
    // If response is valid JSON or non-error, return it
    if (res.ok) {
      return res;
    }

    // If Vercel returns 404, 500, 502, 503 or HTML index page instead of API JSON, fallback to Cloud Run
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || res.status >= 500 || contentType.includes('text/html')) {
      if (!primaryUrl.startsWith(FALLBACK_BACKEND_URL)) {
        console.warn(`[API Info] Primary endpoint ${primaryUrl} returned ${res.status}. Falling back to Live Backend...`);
        return await fetch(`${FALLBACK_BACKEND_URL}${cleanEndpoint}`, options);
      }
    }
    return res;
  } catch (err) {
    // Network / CORS / routing error -> fallback to live Cloud Run backend
    if (!primaryUrl.startsWith(FALLBACK_BACKEND_URL)) {
      console.warn(`[API Info] Network error on ${primaryUrl}. Falling back to Live Backend:`, err);
      return await fetch(`${FALLBACK_BACKEND_URL}${cleanEndpoint}`, options);
    }
    throw err;
  }
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

