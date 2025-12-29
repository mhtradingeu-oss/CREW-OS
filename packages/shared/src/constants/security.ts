// Security constants for CSRF/session/cookies/headers

export const CSRF_COOKIE_NAME = 'mh_csrf';
export const CSRF_HEADER_NAME = 'x-mh-csrf';
export const SESSION_COOKIE_NAME = 'mh_session';
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
