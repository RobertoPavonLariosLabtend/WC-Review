import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthProvider';
import { logout } from '../services/auth';

export default function HomeScreen() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(false);
    try { await logout(); } catch { setError(true); } finally { setSigningOut(false); }
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.card}>
      <Text style={styles.eyebrow}>WC REVIEW</Text>
      <Text accessibilityRole="header" style={styles.title}>Hola{user?.displayName ? `, ${user.displayName}` : ''}</Text>
      <Text style={styles.description}>{user?.email ?? 'Has iniciado sesión.'}</Text>
      <Text accessibilityLabel={`Contador: ${count}`} accessibilityLiveRegion="polite" style={styles.counter}>{count}</Text>
      <Pressable accessibilityRole="button" onPress={() => setCount(value => value + 1)} style={styles.button}><Text style={styles.buttonText}>Incrementar</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setCount(0)} style={styles.secondary}><Text style={styles.secondaryText}>Reiniciar</Text></Pressable>
      <View style={styles.separator} />
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" disabled={signingOut} onPress={() => void signOut()} style={styles.secondary}>{signingOut ? <ActivityIndicator color="#64748b" /> : <Text style={styles.description}>Cerrar sesión</Text>}</Pressable>
      {error && <Text accessibilityRole="alert" style={styles.error}>No se pudo cerrar sesión. Vuelve a intentarlo.</Text>}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 24, padding: 28, gap: 16 },
  eyebrow: { color: '#2563eb', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: '#0f172a', fontSize: 30, fontWeight: '700' },
  description: { color: '#475569', fontSize: 16, lineHeight: 24 },
  counter: { color: '#0f172a', fontSize: 72, fontWeight: '700', textAlign: 'center', marginVertical: 12 },
  button: { backgroundColor: '#2563eb', borderRadius: 12, minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 14 },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  secondary: { minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 14 },
  secondaryText: { color: '#2563eb', fontWeight: '600', fontSize: 16 },
  separator: { height: 1, backgroundColor: '#e2e8f0' },
  error: { color: '#b91c1c', fontSize: 14 },
});
