import type { Attribution, Coordinates } from '../domain/models.ts';

export type CatalogueRecord = {
  id: string; name: string; coordinate: Coordinates; address?: string; description?: string;
  photo?: { asset: string; authors: Attribution[] }; attributions: Attribution[];
};

// Editorial catalogue owned by WC Review. Adding an entry adds its selectable pin.
// These two initial examples have verified sources; no bathroom claims are made.
export const catalogue: CatalogueRecord[] = [
  {
    id: 'casa-labra', name: 'Casa Labra',
    coordinate: { latitude: 40.417197, longitude: -3.704536 },
    address: 'Calle de Tetuán, 12, Madrid',
    description: 'Taberna junto a la Puerta del Sol, conocida por sus tapas y croquetas de bacalao.',
    photo: { asset: 'casa-labra', authors: [
      { name: 'Foto: Tamorlan · Wikimedia Commons (2009)', uri: 'https://commons.wikimedia.org/wiki/File:Casa_Labra-2009.jpg' },
      { name: 'CC BY 3.0 · imagen reducida y encuadrada para la ficha', uri: 'https://creativecommons.org/licenses/by/3.0/' },
    ] },
    attributions: [{ name: 'Fuente de información: Turismo de Madrid', uri: 'https://www.esmadrid.com/restaurantes/casa-labra' }],
  },
  {
    id: 'botin', name: 'Sobrino de Botín',
    coordinate: { latitude: 40.414211, longitude: -3.708086 },
    address: 'Calle de Cuchilleros, 17, Madrid',
    description: 'Restaurante próximo a la Plaza Mayor, especializado en asados de cocina castellana.',
    photo: { asset: 'botin', authors: [
      { name: 'Foto: Tamorlan · Wikimedia Commons (2009)', uri: 'https://commons.wikimedia.org/wiki/File:Casa_Bot%C3%ADn-Madrid-2009.jpg' },
      { name: 'CC BY 3.0 · imagen reducida y encuadrada para la ficha', uri: 'https://creativecommons.org/licenses/by/3.0/' },
    ] },
    attributions: [{ name: 'Fuente de información: Turismo de Madrid', uri: 'https://www.esmadrid.com/restaurantes/botin' }],
  },
];
