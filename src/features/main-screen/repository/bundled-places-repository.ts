import { Image } from 'react-native';
import { createCatalogPlacesRepository } from './catalog-places-repository';
import { catalogue } from './catalogue';

const photos: Record<string, number> = {
  'casa-labra': require('./photos/casa-labra.jpg'),
  botin: require('./photos/botin.jpg'),
};

export function createBundledPlacesRepository() {
  return createCatalogPlacesRepository(catalogue, asset => {
    if (!photos[asset]) throw new Error('Foto no disponible');
    return Image.resolveAssetSource(photos[asset]).uri;
  });
}
