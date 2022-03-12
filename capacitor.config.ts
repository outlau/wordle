import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hacker.wordle',
  appName: 'wordle',
  webDir: 'public',
  bundledWebRuntime: false,
  server: {
    cleartext: true,
    allowNavigation: ['http://87.61.86.131:3000']
  }
};

export default config;
