// Precognix-CyberOracle API Configuration
// When deployed on Netlify / Vercel, set VITE_API_URL to point to your live backend (e.g. Render / Railway)
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
