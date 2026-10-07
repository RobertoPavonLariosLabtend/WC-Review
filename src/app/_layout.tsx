import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthProvider';

function Routes() {
  const { user, initializing, initializationError, retry } = useAuth();
  if (initializing) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" accessibilityLabel="Restaurando sesión" /></View>;
  if (initializationError) return <View style={styles.center}><Text style={styles.error}>No se pudo iniciar el servicio de acceso.</Text><Pressable accessibilityRole="button" onPress={retry}><Text style={styles.retry}>Reintentar</Text></Pressable></View>;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={!user}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!user}><Stack.Screen name="index" /></Stack.Protected>
  </Stack>;
}

export default function RootLayout() {
  return <AuthProvider><StatusBar style="dark" /><Routes /></AuthProvider>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24, gap: 20 },
  error: { color: '#475569', fontSize: 16, textAlign: 'center' },
  retry: { color: '#2563eb', fontSize: 16, padding: 12, fontWeight: '600' },
});
