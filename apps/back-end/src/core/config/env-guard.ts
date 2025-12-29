// Env safety guard and normalization for DB URL

const PROD_MARKERS = [
  'prod-db',
  'prod.',
  'production',
  'mh-os-prod',
  'mh_os_prod',
  'mh-os-main',
  'mh_os_main',
  'cloud',
  'aws',
  'gcp',
  'azure',
  'heroku',
  'railway',
  'supabase',
  'neon',
  'render',
  'vercel',
  'digitalocean',
  'prod-db',
  'prod-',
  'main-',
  'main.',
];

function isLocalhost(url: string) {
  return /localhost|127\.0\.0\.1/.test(url);
}

function isProdLikeUrl(url: string) {
  return PROD_MARKERS.some((m) => url.includes(m)) && !isLocalhost(url);
}

export function getNormalizedDatabaseUrl(): string {
  const env = process.env;
  if (env.NODE_ENV === 'test' && env.DATABASE_URL_TEST) {
    return env.DATABASE_URL_TEST;
  }
  return env.DATABASE_URL || '';
}

export function checkEnvSafety() {
  const env = process.env;
  const dbUrl = getNormalizedDatabaseUrl();
  if (!dbUrl) throw new Error('DATABASE_URL is required');

  if (env.NODE_ENV === 'production') {
    if (isLocalhost(dbUrl)) {
      throw new Error('Refusing to start in production with a localhost database URL.');
    }
  } else {
    if (isProdLikeUrl(dbUrl) && env.ALLOW_REMOTE_DB_IN_DEV !== 'true') {
      throw new Error('Refusing to use a production database in non-production environment. Set ALLOW_REMOTE_DB_IN_DEV=true to override.');
    }
  }
  if (env.NODE_ENV === 'test') {
    if (isProdLikeUrl(dbUrl)) {
      throw new Error('Refusing to use a production database in test environment.');
    }
  }
}
