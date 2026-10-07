import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthProvider';
import { authErrorMessage } from './auth-errors';
import { styles } from './auth-styles';

export default function RegisterScreen() {
  const { useCases } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const passwordInput = useRef<TextInput>(null);
  const confirmationInput = useRef<TextInput>(null);

  async function register() {
    if (locked.current) return;
    locked.current = true;
    Keyboard.dismiss();
    setPending(true);
    setError(null);
    try {
      await useCases.createAccount(email, password, confirmation);
      // Session observation switches the protected route after successful creation.
    } catch (failure) {
      setError(authErrorMessage(failure, 'registration'));
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={styles.content}>
        <View style={styles.container}>
          <View style={styles.brand}><Text style={styles.brandText}>WC</Text></View>
          <Text style={styles.brandName}>WC REVIEW</Text>
          <Text accessibilityRole="header" style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Regístrate con tu email para comenzar.</Text>
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput accessibilityLabel="Email" placeholder="tu@email.com" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" editable={!pending} returnKeyType="next" onSubmitEditing={() => passwordInput.current?.focus()} style={styles.input} />
            </View>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput ref={passwordInput} accessibilityLabel="Contraseña" placeholder="Al menos 6 caracteres" placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" editable={!pending} returnKeyType="next" onSubmitEditing={() => confirmationInput.current?.focus()} style={styles.input} />
              <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'} disabled={pending} onPress={() => setShowPassword(value => !value)} hitSlop={10}><Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#64748b" /></Pressable>
            </View>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput ref={confirmationInput} accessibilityLabel="Confirmar contraseña" placeholder="Repite tu contraseña" placeholderTextColor="#94a3b8" value={confirmation} onChangeText={setConfirmation} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" editable={!pending} returnKeyType="go" onSubmitEditing={() => void register()} style={styles.input} />
            </View>
            {error && <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.errorBox}><Ionicons name="alert-circle-outline" size={18} color="#b91c1c" /><Text style={styles.error}>{error}</Text></View>}
            <Pressable accessibilityRole="button" accessibilityLabel="Crear cuenta" accessibilityState={{ disabled: pending, busy: pending }} disabled={pending} onPress={() => void register()} style={({ pressed }) => [styles.primary, (pressed || pending) && styles.dimmed]}>
              {pending ? <ActivityIndicator color="#ffffff" accessibilityLabel="Creando cuenta" /> : <><Text style={styles.primaryText}>Crear cuenta</Text><Ionicons name="arrow-forward" size={20} color="#ffffff" /></>}
            </Pressable>
          </View>
          <Text style={styles.footer}>¿Ya tienes cuenta?</Text>
          <Link href="/login" replace asChild><Pressable accessibilityRole="button" accessibilityLabel="Volver a iniciar sesión" disabled={pending} style={styles.link}><Text style={styles.linkText}>Iniciar sesión</Text></Pressable></Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
