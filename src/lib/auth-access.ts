export const SITE_ACCESS_COOKIE = 'fdo_site_access';
export const SITE_ACCESS_REMEMBER_DAYS = 15;
export const SITE_ACCESS_REMEMBER_MAX_AGE = SITE_ACCESS_REMEMBER_DAYS * 24 * 60 * 60;

function isSecureCookieContext() {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production';
  }

  return window.location.protocol === 'https:';
}

export function buildSiteAccessCookie(rememberMe: boolean): string {
  const parts = [
    `${SITE_ACCESS_COOKIE}=1`,
    'Path=/',
    'SameSite=Lax',
  ];

  if (isSecureCookieContext()) {
    parts.push('Secure');
  }

  if (rememberMe) {
    parts.push(`Max-Age=${SITE_ACCESS_REMEMBER_MAX_AGE}`);
  }

  return parts.join('; ');
}

export function clearSiteAccessCookie(): string {
  const parts = [
    `${SITE_ACCESS_COOKIE}=`,
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (isSecureCookieContext()) {
    parts.push('Secure');
  }

  return parts.join('; ');
}
