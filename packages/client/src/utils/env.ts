/**
 * Environment-aware URL helpers.
 * In development, the Vite proxy handles /api and /socket.io routing.
 * In production, use explicit backend URLs from environment variables.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const WS_BASE_HOST = import.meta.env.VITE_WS_URL || window.location.host;
export const IS_PROD = import.meta.env.PROD;
