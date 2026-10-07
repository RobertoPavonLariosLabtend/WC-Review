import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/ui/AuthProvider';
import type { MainUseCases } from '../use-cases';
import { EstablishmentCard } from './EstablishmentCard';
import { createSelectionLoader, type SelectionState } from './selection-loader';
const MADRID = { latitude: 40.4168, longitude: -3.7038, latitudeDelta: 0.06, longitudeDelta: 0.06 };
export default function MainScreen({ useCases, mapReady }: { useCases: MainUseCases; mapReady: boolean }) {
  const { user, useCases: auth } = useAuth();
  const insets = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const [size, setSize] = useState({ height: 0, header: 0 });
  const [state, setState] = useState<SelectionState>(null);
  const [loader] = useState(() => createSelectionLoader(useCases, setState));
  const [signingOut, setSigningOut] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const locationGeneration = useRef(0);
  useEffect(() => () => { loader.dispose(); locationGeneration.current++; }, [loader]);
  const cardHeight = Math.max(0, (size.height - insets.top - insets.bottom) * 0.5);
  const bottom = state ? cardHeight + insets.bottom : insets.bottom;
  useEffect(() => {
    if (state?.selection) map.current?.animateCamera({ center: state.selection.coordinate }, { duration: 250 });
  }, [state?.selection, cardHeight]);
  async function signOut() {
    if (signingOut) return;
    loader.clear(); locationGeneration.current++; setLocating(false); setSigningOut(true); setMessage('');
    try { await auth.logout(); }
    catch { setMessage('No se pudo cerrar sesión. Vuelve a intentarlo.'); }
    finally { setSigningOut(false); }
  }
  async function locate() {
    if (locating) return;
    const generation = ++locationGeneration.current;
    setLocating(true); setMessage('');
    try {
      const center = await useCases.locate();
      if (generation === locationGeneration.current) map.current?.animateCamera({ center, zoom: 16 });
    } catch (error) {
      if (generation === locationGeneration.current) setMessage((error as { code?: string }).code === 'location-denied' ? 'Permiso de ubicación denegado. Puedes seguir explorando el mapa.' : 'No se pudo obtener tu ubicación. Puedes seguir explorando el mapa.');
    } finally { if (generation === locationGeneration.current) setLocating(false); }
  }
  return <View style={styles.screen} onLayout={event => setSize(value => ({ ...value, height: event.nativeEvent.layout.height }))}>
    {mapReady ? <MapView ref={map} provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFill} initialRegion={MADRID}
      mapPadding={{ top: size.header + insets.top + 12, bottom: bottom + 12, left: 12, right: 12 }}
      showsMyLocationButton={false} toolbarEnabled={false}
      onPoiClick={event => {
        if (signingOut) return;
        const { placeId, name, coordinate } = event.nativeEvent;
        try { void loader.select({ placeId, name, coordinate }).catch(() => {}); } catch { /* Ordinary map taps are not selections. */ }
      }}>
      {state && <Marker coordinate={state.selection.coordinate} title={state.selection.name} pinColor="#2563eb" />}
    </MapView> : <View style={styles.unavailable}><Text style={styles.body}>El mapa no está disponible en esta versión. Su configuración está pendiente.</Text></View>}
    <View style={[styles.header, { top: insets.top + 8 }]} onLayout={event => setSize(value => ({ ...value, header: event.nativeEvent.layout.height }))}>
      <Text style={styles.user} numberOfLines={2}>{user?.displayName ?? user?.email ?? 'WC Review'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" disabled={signingOut} onPress={() => void signOut()} style={styles.button}>{signingOut ? <ActivityIndicator /> : <Text style={styles.link}>Cerrar sesión</Text>}</Pressable>
    </View>
    {message !== '' && <View style={[styles.notice, { top: insets.top + size.header + 20 }]}><Text accessibilityRole="alert" style={styles.body}>{message}</Text></View>}
    {mapReady && <Pressable accessibilityRole="button" disabled={locating || signingOut} onPress={() => void locate()} style={[styles.location, { bottom: bottom + 48 }]}>{locating ? <ActivityIndicator accessibilityLabel="Buscando ubicación" /> : <Text style={styles.link}>Mi ubicación</Text>}</Pressable>}
    {state && <View style={[styles.card, { bottom: insets.bottom }]}><EstablishmentCard key={`${state.selection.placeId}-${state.photo?.uri ? 'photo' : 'placeholder'}`} state={state} height={cardHeight} close={() => loader.clear()} retry={() => { void loader.select(state.selection); }} /></View>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16, backgroundColor: '#fff' },
  user: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a' }, button: { minHeight: 48, justifyContent: 'center', padding: 8 },
  link: { color: '#2563eb', fontWeight: '600', fontSize: 16 }, body: { color: '#475569', fontSize: 16, lineHeight: 24 },
  unavailable: { flex: 1, justifyContent: 'center', padding: 28 },
  notice: { position: 'absolute', left: 12, right: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  location: { position: 'absolute', right: 16, backgroundColor: '#fff', paddingHorizontal: 16, minHeight: 48, justifyContent: 'center', borderRadius: 16 },
  card: { position: 'absolute', left: 0, right: 0 },
});
