/**
 * Token storage strategy for this assessment:
 * JWT is stored in localStorage for simple SPA auth.
 *
 * Trade-off vs HttpOnly cookies:
 * - localStorage is convenient for Bearer-token SPAs and Vite proxies,
 *   but is vulnerable to XSS if malicious scripts run in the page.
 * - HttpOnly Secure cookies are safer against XSS token theft, but need
 *   CSRF protections and cookie-based backend support.
 *
 * Prefer HttpOnly cookies for production when the API supports them.
 */

const TOKEN_KEY = 'stm_access_token';
const USER_KEY = 'stm_auth_user';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuthStorage = () => {
  clearStoredToken();
  clearStoredUser();
};
