import { mainError, type DisplayPhoto } from '../domain/models.ts';
import { httpsUrl, text } from './osm-mapping.ts';
import { providerJson, type ProviderFetch } from './provider-http.ts';

function plainText(value: unknown) {
  return text(value)?.replace(/<[^>]*>/g, '').replace(/&#(x[0-9a-f]+|\d+);/gi, (_, number: string) => {
    const code = number[0].toLowerCase() === 'x' ? parseInt(number.slice(1), 16) : Number(number);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  }).replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
}
export async function loadCommonsPhoto(file: string, fetcher: ProviderFetch, signal: AbortSignal): Promise<DisplayPhoto> {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', titles: file,
    iiprop: 'url|mime|extmetadata', iiurlwidth: '960', iiextmetadatalanguage: 'es',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|AttributionRequired',
  });
  const data = await providerJson(fetcher, `https://commons.wikimedia.org/w/api.php?${params}`, {}, signal) as {
    query?: { pages?: { imageinfo?: { thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> }[] }[] };
  };
  const info = data?.query?.pages?.[0]?.imageinfo?.[0];
  const uri = httpsUrl(info?.thumburl);
  const artist = plainText(info?.extmetadata?.Artist?.value);
  const license = plainText(info?.extmetadata?.LicenseShortName?.value);
  const licenseUri = httpsUrl(info?.extmetadata?.LicenseUrl?.value?.replace(/^http:\/\/creativecommons\.org\//, 'https://creativecommons.org/'));
  if (!uri || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(uri).hostname) || !['image/jpeg', 'image/png', 'image/webp'].includes(info?.mime ?? '')
    || !artist || !license || !licenseUri || !/^https:\/\/creativecommons\.org\/(licenses\/by(-sa)?\/|publicdomain\/(zero|mark)\/)/.test(licenseUri)) throw mainError('unavailable');
  const imageUrl = new URL(uri);
  imageUrl.search = '';
  return {
    uri: imageUrl.href,
    authors: [
      { name: `Foto: ${artist} · Wikimedia Commons`, uri: `https://commons.wikimedia.org/wiki/${encodeURIComponent(file)}` },
      { name: `${license} · imagen encuadrada para la ficha`, uri: licenseUri },
    ],
  };
}
