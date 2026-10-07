import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import plist from '@expo/plist';
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const iosPath = './config/firebase/GoogleService-Info.plist';
  const androidPath = './config/firebase/google-services.json';
  const ios = plist.parse(readFileSync(resolve(__dirname, iosPath), 'utf8')) as Record<string, unknown>;
  const android = JSON.parse(readFileSync(resolve(__dirname, androidPath), 'utf8'));
  const client = android.client?.find((item: { client_info?: { android_client_info?: { package_name?: string } } }) =>
    item.client_info?.android_client_info?.package_name === config.android?.package);
  if (ios.BUNDLE_ID !== config.ios?.bundleIdentifier || !client || ios.PROJECT_ID !== android.project_info?.project_id) {
    throw new Error('Los archivos Firebase deben pertenecer al mismo proyecto y a com.wcreview.app.');
  }
  const webClient = client.oauth_client?.find((item: { client_type?: number }) => item.client_type === 3);
  const googleAuth = {
    iosClientId: typeof ios.CLIENT_ID === 'string' ? ios.CLIENT_ID : undefined,
    iosUrlScheme: typeof ios.REVERSED_CLIENT_ID === 'string' ? ios.REVERSED_CLIENT_ID : undefined,
    webClientId: webClient?.client_id as string | undefined,
  };
  const plugins: NonNullable<ExpoConfig['plugins']> = [
    ['expo-build-properties', { ios: { enableSceneSupport: true, useFrameworks: 'static', forceStaticLinking: ['RNFBApp', 'RNFBAuth'] } }],
    ['@react-native-firebase/app', { ios: { disableSPM: true } }],
    '@react-native-firebase/auth',
    'expo-font',
    'expo-router',
    '@maplibre/maplibre-react-native',
    ['expo-location', { locationWhenInUsePermission: 'Permite a WC Review centrar el mapa en tu ubicación cuando lo solicites.' }],
  ];
  if (googleAuth.iosUrlScheme) plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: googleAuth.iosUrlScheme }]);

  return {
    ...config,
    name: config.name ?? 'WC Review',
    slug: config.slug ?? 'wc-review',
    scheme: 'wcreview',
    ios: { ...config.ios, googleServicesFile: iosPath },
    android: { ...config.android, googleServicesFile: androidPath },
    plugins,
    extra: { ...config.extra, googleAuth },
  };
};
