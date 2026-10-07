import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthProvider';
import { authErrorMessage, isAuthCancellation } from './auth-errors';

type Method = 'email' | 'google';

export default function LoginScreen() {
  const { useCases } = useAuth();
  const googleAvailable = useCases.isGoogleAvailable();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const passwordInput = useRef<TextInput>(null);

  async function signIn(method: Method) {
    if (locked.current) return;
    Keyboard.dismiss();
    locked.current = true;
    setPending(method);
    setError(null);
    try {
      if (method === 'email') await useCases.loginWithEmail(email, password);
      if (method === 'google') await useCases.loginWithGoogle();
    } catch (failure) {
      if (!isAuthCancellation(failure)) setError(authErrorMessage(failure));
    } finally {
      locked.current = false;
      setPending(null);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
          <View style={styles.container}>
            <View style={styles.brand}><Text style={styles.brandText}>WC</Text></View>
            <Text style={styles.brandName}>WC REVIEW</Text>
            <Text accessibilityRole="header" style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar.</Text>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748b" />
                <TextInput accessibilityLabel="Email" placeholder="tu@email.com" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" editable={!pending} returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} style={styles.input} />
              </View>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                <TextInput ref={passwordInput} accessibilityLabel="Contraseña" placeholder="Tu contraseña" placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" editable={!pending} returnKeyType="go" onSubmitEditing={() => void signIn('email')} style={styles.input} />
                <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} disabled={!!pending} onPress={() => setShowPassword(value => !value)} hitSlop={10}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#64748b" /></Pressable>
              </View>
              {error && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color="#b91c1c" /><Text style={styles.error}>{error}</Text></View>}
              <Pressable accessibilityRole="button" accessibilityLabel="Iniciar sesión" accessibilityState={{ disabled: !!pending, busy: pending === 'email' }} disabled={!!pending} onPress={() => void signIn('email')} style={({ pressed }) => [styles.primary, (pressed || !!pending) && styles.dimmed]}>
                {pending === 'email' ? <ActivityIndicator color="#ffffff" accessibilityLabel="Iniciando sesión" /> : <><Text style={styles.primaryText}>Iniciar sesión</Text><Ionicons name="arrow-forward" size={20} color="#ffffff" /></>}
              </Pressable>
            </View>

            <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>o continúa con</Text><View style={styles.line} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Continuar con Google" accessibilityState={{ disabled: !!pending || !googleAvailable, busy: pending === 'google' }} disabled={!!pending || !googleAvailable} onPress={() => void signIn('google')} style={({ pressed }) => [styles.social, (pressed || !!pending || !googleAvailable) && styles.dimmed]}>
              {pending === 'google' ? <ActivityIndicator color="#2563eb" /> : <><Ionicons name="logo-google" size={20} color="#2563eb" /><Text style={styles.socialText}>Continuar con Google</Text></>}
            </Pressable>
            {!googleAvailable && <Text style={styles.unavailable}>Google estará disponible próximamente.</Text>}
            <Text style={styles.footer}>Tu cuenta, siempre contigo.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32 },
  container: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 12 },
  brand: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  brandText: { color: '#ffffff', fontSize: 25, fontWeight: '800', letterSpacing: -1 },
  brandName: { textAlign: 'center', color: '#2563eb', letterSpacing: 3, fontSize: 12, fontWeight: '700', marginBottom: 16 },
  title: { color: '#0f172a', fontSize: 29, fontWeight: '700', textAlign: 'center', letterSpacing: -0.7 },
  subtitle: { color: '#64748b', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  form: { gap: 12 },
  label: { color: '#334155', fontSize: 14, fontWeight: '600', marginTop: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, backgroundColor: '#ffffff', paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, color: '#0f172a', paddingVertical: 16 },
  primary: { marginTop: 8, borderRadius: 14, backgroundColor: '#2563eb', minHeight: 56, padding: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryText: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  dimmed: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 16 },
  line: { height: 1, flex: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 13 },
  social: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, minHeight: 56, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16 },
  socialText: { color: '#334155', fontWeight: '600', fontSize: 16 },
  unavailable: { color: '#64748b', textAlign: 'center', fontSize: 12, marginBottom: 4 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  error: { color: '#b91c1c', fontSize: 14, flex: 1, lineHeight: 20 },
  footer: { color: '#94a3b8', textAlign: 'center', fontSize: 12, marginTop: 20 },
});
