import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maha.taskflow',
  appName: 'TaskFlow by Maha',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    backgroundColor: '#07080c'
  }
};

export default config;
