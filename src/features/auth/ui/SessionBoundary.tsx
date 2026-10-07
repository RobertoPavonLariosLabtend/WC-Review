import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './AuthProvider';

export function SessionBoundary({ children }: PropsWithChildren) {
  const { initializing, initializationError, retry } = useAuth();
  if (initializing) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" accessibilityLabel="Restaurando sesión" /></View>;
  if (initializationError) return <View style={styles.center}><Text style={styles.error}>No se pudo iniciar el servicio de acceso.</Text><Pressable accessibilityRole="button" onPress={retry}><Text style={styles.retry}>Reintentar</Text></Pressable></View>;
  return children;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 24, gap: 20 },
  error: { color: '#475569', fontSize: 16, textAlign: 'center' },
  retry: { color: '#2563eb', fontSize: 16, padding: 12, fontWeight: '600' },
});
