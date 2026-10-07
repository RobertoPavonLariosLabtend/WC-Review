import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Attribution } from '../domain/models';
import type { SelectionState } from './selection-loader';
const tagLabels: Record<string, string> = { yes: 'Sí', no: 'No', limited: 'Limitado', customers: 'Solo clientes', permissive: 'Permitido', private: 'Privado', public: 'Público', designated: 'Adaptado' };
function tagLabel(value?: string) { return value ? tagLabels[value] ?? value : 'Sin datos'; }
function Credits({ items }: { items: Attribution[] }) {
  return <>{items.map((item, index) => <Text key={`${item.name}-${index}`} accessibilityRole={item.uri ? 'link' : 'text'} onPress={item.uri?.startsWith('https://') ? () => { void Linking.openURL(item.uri!).catch(() => {}); } : undefined} style={styles.credit}>{item.name}</Text>)}</>;
}
export function EstablishmentCard({ state, height, close, retry, children }: { state: NonNullable<SelectionState>; height: number; close: () => void; retry: () => void; children?: ReactNode }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { details, photo } = state;
  return <View style={[styles.card, { height }]}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>{details?.name ?? state.selection.name}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar ficha" onPress={close} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
      </View>
      {state.loading ? <ActivityIndicator accessibilityLabel="Cargando establecimiento" color="#2563eb" /> : state.error ? <View>
        <Text accessibilityRole="alert" style={styles.body}>No se pudo cargar la información. Comprueba tu conexión y vuelve a intentarlo.</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}><Text style={styles.link}>Reintentar</Text></Pressable>
      </View> : <>
        {photo && !imageFailed ? <Image accessibilityLabel={`Foto de ${details?.name ?? state.selection.name}`} source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" onError={() => setImageFailed(true)} /> : <View style={[styles.image, styles.placeholder]}>{state.photoLoading ? <ActivityIndicator accessibilityLabel="Cargando foto" /> : <Text style={styles.body}>Foto no disponible</Text>}</View>}
        {photo && !imageFailed && <Credits items={photo.authors} />}
        {details?.category && <Text style={styles.body}>{details.category}</Text>}
        <Text style={styles.body}>{details?.description ?? 'Descripción no disponible'}</Text>
        {details?.address && <Text style={styles.body}>{details.address}</Text>}
        {details?.openingHours && <Text style={styles.body}>Horario registrado: {details.openingHours}</Text>}
        {details?.website && <Credits items={[{ name: 'Web del establecimiento', uri: details.website }]} />}
        {details?.toilets && <>
          <Text style={styles.body}>Baño indicado en OSM: {tagLabel(details.toilets.availability)}</Text>
          {details.toilets.access && <Text style={styles.body}>Acceso al baño: {tagLabel(details.toilets.access)}</Text>}
          {details.toilets.wheelchair && <Text style={styles.body}>Acceso con silla de ruedas: {tagLabel(details.toilets.wheelchair)}</Text>}
          {details.toilets.fee && <Text style={styles.body}>Baño de pago: {tagLabel(details.toilets.fee)}</Text>}
        </>}
        <Credits items={details?.attributions ?? []} />
        {children}
      </>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  content: { padding: 20, gap: 12 }, heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 23, fontWeight: '700', color: '#0f172a' },
  close: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 30, color: '#475569' },
  body: { fontSize: 16, color: '#475569', lineHeight: 24 }, credit: { fontSize: 12, color: '#475569' },
  image: { width: '100%', height: 150, borderRadius: 12 }, placeholder: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  retry: { minHeight: 48, justifyContent: 'center' }, link: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
});
