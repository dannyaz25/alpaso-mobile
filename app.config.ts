import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Alpaso',
  slug: 'alpaso-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#2d1810'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.alpaso.mobile',
    infoPlist: {
      NSCameraUsageDescription: 'Alpaso necesita acceso a la cámara para transmisiones en vivo.',
      NSMicrophoneUsageDescription: 'Alpaso necesita acceso al micrófono para transmisiones en vivo.',
      NSPhotoLibraryUsageDescription: 'Alpaso necesita acceso a la galería para subir imágenes de productos.'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2d1810'
    },
    package: 'com.alpaso.mobile',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    // Environment variables for the app
    enableRealCamera: process.env.EXPO_PUBLIC_ENABLE_REAL_CAMERA || 'true',
    dailyEnableRealStreaming: process.env.EXPO_PUBLIC_DAILY_ENABLE_REAL_STREAMING || 'true',
    forceMockMode: process.env.EXPO_PUBLIC_FORCE_MOCK_MODE || 'false',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5003',
    dailyApiKey: process.env.EXPO_PUBLIC_DAILY_API_KEY || '6059cd027be01fa53b599c57c4de4ff33e5aec85a93b0802541ff090e5401f1f',
    eas: {
      projectId: 'alpaso-mobile-project'
    }
  }
});
