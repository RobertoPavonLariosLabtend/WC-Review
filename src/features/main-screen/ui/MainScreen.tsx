import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/ui/AuthProvider';
import type { MainUseCases } from '../use-cases';
import { EstablishmentCard } from './EstablishmentCard';
import { createSelectionLoader, type SelectionState } from './selection-loader';
import { INITIAL_PLACE_BOUNDS, MAX_PLACES, type PlaceBounds, type PlaceSelection } from '../domain/models';
import { EstablishmentMap, type EstablishmentMapHandle } from './EstablishmentMap';
import { createPlacesLoader, type PlacesState } from './places-loader';
export default function MainScreen({ useCases }: { useCases: MainUseCases }) {
  const { user, useCases: auth } = useAuth();
  const insets = useSafeAreaInsets();
  const map = useRef<EstablishmentMapHandle>(null);
  const [size, setSize] = useState({ height: 0, header: 0, catalogue: 0, notice: 0 });
  const [{ places, loading: catalogueLoading, error: catalogueError }, setPlacesState] = useState<PlacesState>({ places: [], loading: true });
  const [placesLoader] = useState(() => createPlacesLoader(useCases, setPlacesState));
  const visibleBounds = useRef<PlaceBounds>(INITIAL_PLACE_BOUNDS);
  const searchedBounds = useRef<PlaceBounds>(INITIAL_PLACE_BOUNDS);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapAttempt, setMapAttempt] = useState(0);
  const [state, setState] = useState<SelectionState>(null);
  const [loader] = useState(() => createSelectionLoader(useCases, setState));
  const [signingOut, setSigningOut] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const locationGeneration = useRef(0);
  useEffect(() => () => { loader.dispose(); locationGeneration.current++; }, [loader]);
  useEffect(() => {
    void placesLoader.search(INITIAL_PLACE_BOUNDS);
    return () => placesLoader.dispose();
  }, [placesLoader]);
  const noticeVisible = message !== '' || mapStatus !== 'ready';
  const overlayBottom = insets.top + size.header + size.catalogue + 32 + (noticeVisible ? size.notice + 12 : 0);
  const cardHeight = Math.max(0, Math.min((size.height - insets.top - insets.bottom) * 0.5, size.height - overlayBottom - insets.bottom - 120));
  const bottom = state ? cardHeight + insets.bottom : insets.bottom;
  const padding = useMemo(() => ({ top: overlayBottom, bottom: bottom + 12, left: 12, right: 12 }), [overlayBottom, bottom]);
  function select(place: PlaceSelection) {
    if (!signingOut) void loader.select(place).catch(() => {});
  }
  function search(bounds: PlaceBounds) {
    if (signingOut || catalogueLoading) return;
    loader.clear();
    searchedBounds.current = { ...bounds };
    void placesLoader.search(searchedBounds.current);
  }
  async function signOut() {
    if (signingOut) return;
    loader.clear(); placesLoader.dispose(); locationGeneration.current++; setLocating(false); setSigningOut(true); setMessage('');
    try { await auth.logout(); }
    catch { setMessage('No se pudo cerrar sesión. Vuelve a intentarlo.'); void placesLoader.search(searchedBounds.current); }
    finally { setSigningOut(false); }
  }
  async function locate() {
    if (locating) return;
    const generation = ++locationGeneration.current;
    setLocating(true); setMessage('');
    try {
      const center = await useCases.locate();
      if (generation === locationGeneration.current) map.current?.centerOn(center);
    } catch (error) {
      if (generation === locationGeneration.current) setMessage((error as { code?: string }).code === 'location-denied' ? 'Permiso de ubicación denegado. Puedes seguir explorando el mapa.' : 'No se pudo obtener tu ubicación. Puedes seguir explorando el mapa.');
    } finally { if (generation === locationGeneration.current) setLocating(false); }
  }
  return <View style={styles.screen} onLayout={event => {
    const { height } = event.nativeEvent.layout;
    setSize(value => value.height === height ? value : { ...value, height });
  }}>
    <EstablishmentMap key={mapAttempt} ref={map} places={places} selected={state?.selection} padding={padding}
      onSelect={select} onReady={() => setMapStatus('ready')} onError={() => setMapStatus('error')}
      onBoundsChange={bounds => { visibleBounds.current = bounds; }} />
    <View style={[styles.header, { top: insets.top + 8 }]} onLayout={event => {
      const { height } = event.nativeEvent.layout;
      setSize(value => value.header === height ? value : { ...value, header: height });
    }}>
      <Text style={styles.user} numberOfLines={2}>{user?.displayName ?? user?.email ?? 'WC Review'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" disabled={signingOut} onPress={() => void signOut()} style={styles.button}>{signingOut ? <ActivityIndicator /> : <Text style={styles.link}>Cerrar sesión</Text>}</Pressable>
    </View>
    <View style={[styles.catalogue, { top: insets.top + size.header + 20 }]} onLayout={event => {
      const { height } = event.nativeEvent.layout;
      setSize(value => value.catalogue === height ? value : { ...value, catalogue: height });
    }}>
      <Text style={styles.hint}>OpenStreetMap · {places.length} sitios · toca un punto azul</Text>
      <Pressable accessibilityRole="button" disabled={catalogueLoading || signingOut || mapStatus !== 'ready'} onPress={() => search(visibleBounds.current)} style={styles.button}><Text style={styles.link}>Buscar en esta zona</Text></Pressable>
      {catalogueLoading && <ActivityIndicator accessibilityLabel="Cargando establecimientos" />}
      {catalogueError && <>
        <Text accessibilityRole="alert" style={styles.body}>{catalogueError === 'area-too-large' ? 'Acerca el mapa para buscar en una zona más pequeña.' : catalogueError === 'rate-limit' ? 'Espera un minuto antes de volver a buscar.' : 'No se pudieron cargar los sitios. Comprueba tu conexión y reintenta.'}</Text>
        <Pressable accessibilityRole="button" disabled={signingOut || catalogueLoading} onPress={() => search(searchedBounds.current)} style={styles.button}><Text style={styles.link}>Reintentar establecimientos</Text></Pressable>
      </>}
      {places.length > 0 && <FlatList horizontal data={places} keyExtractor={place => place.placeId}
        initialNumToRender={8} maxToRenderPerBatch={8} windowSize={3} style={styles.list}
        showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}
        extraData={[state?.selection.placeId, signingOut, catalogueLoading]}
        renderItem={({ item: place }) => <Pressable accessibilityRole="button" accessibilityState={{ selected: state?.selection.placeId === place.placeId }} disabled={signingOut || catalogueLoading} onPress={() => select(place)} style={styles.choice}><Text style={styles.link}>{place.name}</Text></Pressable>} />}
      {!catalogueLoading && !catalogueError && !places.length && <Text style={styles.body}>No hay sitios registrados en esta zona. Prueba otra zona.</Text>}
      {places.length >= MAX_PLACES && <Text style={styles.hint}>Hasta {MAX_PLACES} sitios por búsqueda. Acerca el mapa para ver más detalle.</Text>}
    </View>
    {noticeVisible && <View style={[styles.notice, { top: insets.top + size.header + size.catalogue + 32 }]} onLayout={event => {
      const { height } = event.nativeEvent.layout;
      setSize(value => value.notice === height ? value : { ...value, notice: height });
    }}>
      {message !== '' && <Text accessibilityRole="alert" style={styles.body}>{message}</Text>}
      {mapStatus === 'loading' && <ActivityIndicator accessibilityLabel="Cargando mapa" />}
      {mapStatus === 'error' && <><Text accessibilityRole="alert" style={styles.body}>No se pudo cargar el mapa. Comprueba tu conexión.</Text><Pressable accessibilityRole="button" onPress={() => { setMapStatus('loading'); setMapAttempt(value => value + 1); }} style={styles.button}><Text style={styles.link}>Reintentar mapa</Text></Pressable></>}
    </View>}
    <Pressable accessibilityRole="button" disabled={locating || signingOut || mapStatus !== 'ready'} onPress={() => void locate()} style={[styles.location, { bottom: bottom + 48 }]}>{locating ? <ActivityIndicator accessibilityLabel="Buscando ubicación" /> : <Text style={styles.link}>Mi ubicación</Text>}</Pressable>
    {state && <View style={[styles.card, { bottom: insets.bottom }]}><EstablishmentCard key={`${state.selection.placeId}-${state.photo?.uri ? 'photo' : 'placeholder'}`} state={state} height={cardHeight} close={() => loader.clear()} retry={() => { void loader.select(state.selection); }} /></View>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16, backgroundColor: '#fff' },
  user: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a' }, button: { minHeight: 48, justifyContent: 'center', padding: 8 },
  link: { color: '#2563eb', fontWeight: '600', fontSize: 16 }, body: { color: '#475569', fontSize: 16, lineHeight: 24 },
  catalogue: { position: 'absolute', left: 12, right: 12, padding: 8, borderRadius: 12, backgroundColor: '#fff' },
  hint: { fontSize: 12, color: '#475569' }, choices: { gap: 8 },
  list: { flexGrow: 0 },
  choice: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  notice: { position: 'absolute', left: 12, right: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  location: { position: 'absolute', right: 16, backgroundColor: '#fff', paddingHorizontal: 16, minHeight: 48, justifyContent: 'center', borderRadius: 16 },
  card: { position: 'absolute', left: 0, right: 0 },
});
