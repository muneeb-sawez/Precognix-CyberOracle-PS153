// Precognix-CyberOracle API Configuration
// Handles local dev (http://127.0.0.1:8000) and cloud HTTPS hosting (e.g. Render / Railway via VITE_API_URL)

export const IS_HOSTED_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';

export const API_BASE = (
  import.meta.env.VITE_API_URL || 
  (IS_HOSTED_HTTPS ? '' : 'http://127.0.0.1:8000')
).replace(/\/+$/, '');

export const HAS_LIVE_API = Boolean(import.meta.env.VITE_API_URL || !IS_HOSTED_HTTPS);
