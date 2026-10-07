import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../composition/AppProviders';
import { useAuth } from '../features/auth/ui/AuthProvider';
import { SessionBoundary } from '../features/auth/ui/SessionBoundary';

function Routes() {
  const { user } = useAuth();
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={!user}><Stack.Screen name="login" /><Stack.Screen name="register" /></Stack.Protected>
    <Stack.Protected guard={!!user}><Stack.Screen name="index" /></Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <AppProviders><StatusBar style="dark" /><SessionBoundary><Routes /></SessionBoundary></AppProviders>;
}
