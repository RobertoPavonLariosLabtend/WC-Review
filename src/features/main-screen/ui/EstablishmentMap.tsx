import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { StyleSheet } from 'react-native';
import type { Coordinates, PlaceSelection, PlaceBounds } from '../domain/models';

export type EstablishmentMapHandle = { centerOn(coordinate: Coordinates): void };
type Props = {
  ref?: Ref<EstablishmentMapHandle>; places: PlaceSelection[]; selected?: PlaceSelection;
  padding: { top: number; bottom: number; left: number; right: number };
  onSelect(place: PlaceSelection): void; onReady(): void; onError(): void;
  onBoundsChange(bounds: PlaceBounds): void;
};
const INITIAL = { center: [-3.7038, 40.4168] as [number, number], zoom: 14.5 };

export function EstablishmentMap({ ref, places, selected, padding, onSelect, onReady, onError, onBoundsChange }: Props) {
  const camera = useRef<CameraRef>(null);
  useImperativeHandle(ref, () => ({
    centerOn: coordinate => camera.current?.easeTo({ center: [coordinate.longitude, coordinate.latitude], zoom: 16, duration: 250 }),
  }), []);
  useEffect(() => {
    if (selected) camera.current?.easeTo({ center: [selected.coordinate.longitude, selected.coordinate.latitude], padding, duration: 250 });
  }, [selected, padding]);
  const data = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: places.map(place => ({
      type: 'Feature' as const, id: place.placeId,
      properties: { placeId: place.placeId, name: place.name },
      geometry: { type: 'Point' as const, coordinates: [place.coordinate.longitude, place.coordinate.latitude] },
    })),
  }), [places]);
  return <Map style={StyleSheet.absoluteFill} mapStyle="https://tiles.openfreemap.org/styles/liberty"
    attribution attributionPosition={{ bottom: padding.bottom, left: 12 }}
    logoPosition={{ bottom: padding.bottom, left: 44 }}
    compassPosition={{ top: padding.top, right: 12 }}
    onDidFinishLoadingStyle={onReady} onDidFailLoadingMap={onError}
    onRegionDidChange={event => {
      const [west, south, east, north] = event.nativeEvent.bounds;
      onBoundsChange({ west, south, east, north });
    }}>
    <Camera ref={camera} initialViewState={INITIAL} padding={padding} />
    <GeoJSONSource id="wc-establishments" data={data} onPress={event => {
      const id = event.nativeEvent.features[0]?.properties?.placeId;
      event.stopPropagation();
      const place = places.find(item => item.placeId === id);
      if (place) onSelect(place);
    }}>
      <Layer id="wc-pins" type="circle" paint={{
        'circle-radius': ['case', ['==', ['get', 'placeId'], selected?.placeId ?? ''], 11, 8],
        'circle-color': '#2563eb', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3,
      }} />
      <Layer id="wc-names" type="symbol" layout={{
        'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-anchor': 'top', 'text-offset': [0, 1.2],
      }} paint={{ 'text-color': '#1e3a8a', 'text-halo-color': '#fff', 'text-halo-width': 2 }} />
    </GeoJSONSource>
  </Map>;
}
