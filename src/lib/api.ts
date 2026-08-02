/**
 * Dynamically resolves the API endpoint URL depending on the current hosting origin.
 * If running on Cloud Run, AI Studio local preview, or localhost, relative paths are used.
 * For external platforms like Vercel, requests are proxied to the live Cloud Run backend.
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const origin = window.location.origin;
  if (
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') || 
    origin.includes('.run.app') || 
    origin.includes('.ai.studio')
  ) {
    return cleanEndpoint;
  }
  
  // Fallback production Cloud Run backend URL
  const backendBaseUrl = 'https://vibranium-ai-349153338672.us-west1.run.app';
  return `${backendBaseUrl}${cleanEndpoint}`;
}
