export interface BuildConfig {
  environment: 'development' | 'production' | 'testing';
  apiUrl: string;
  cdnUrl: string;
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
  version: string;
}

export const BUILD_CONFIG: BuildConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  apiUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://api.momsters-game.com'
      : 'http://localhost:3001',
  cdnUrl: process.env.NODE_ENV === 'production' ? 'https://cdn.momsters-game.com' : '/assets',
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableErrorTracking: process.env.NODE_ENV === 'production',
  version: process.env.npm_package_version || '1.0.0',
};
