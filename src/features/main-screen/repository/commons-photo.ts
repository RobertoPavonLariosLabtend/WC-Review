import { mainError, type DisplayPhoto } from '../domain/models.ts';
import { commonsCategory, commonsFile, httpsUrl, text, type OsmPhotoSource } from './osm-mapping.ts';
import { providerJson, type ProviderFetch } from './provider-http.ts';

function plainText(value: unknown) {
  return text(value)?.replace(/<[^>]*>/g, '').replace(/&#(x[0-9a-f]+|\d+);/gi, (_, number: string) => {
    const code = number[0].toLowerCase() === 'x' ? parseInt(number.slice(1), 16) : Number(number);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  }).replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
}
type ImageInfo = { thumburl?: string; mime?: string; extmetadata?: Record<string, { value?: string }> };
type CommonsResponse = { query?: { pages?: { title?: string; imageinfo?: ImageInfo[] }[] } };
function imageParams() {
  return {
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', maxlag: '5',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '960', iiextmetadatalanguage: 'es',
    iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|AttributionRequired',
  };
}
function creditedPhoto(file: string, info?: ImageInfo): DisplayPhoto {
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
export async function loadCommonsPhoto(file: string, fetcher: ProviderFetch, signal: AbortSignal): Promise<DisplayPhoto> {
  if (!commonsFile(file)) throw mainError('invalid-selection');
  const params = new URLSearchParams({ ...imageParams(), titles: file });
  const data = await providerJson(fetcher, `https://commons.wikimedia.org/w/api.php?${params}`, {}, signal) as CommonsResponse;
  return creditedPhoto(file, data?.query?.pages?.[0]?.imageinfo?.[0]);
}
async function categoryPhoto(category: string, fetcher: ProviderFetch, signal: AbortSignal): Promise<DisplayPhoto> {
  const params = new URLSearchParams({
    ...imageParams(), generator: 'categorymembers', gcmtitle: category, gcmtype: 'file', gcmlimit: '6',
  });
  const data = await providerJson(fetcher, `https://commons.wikimedia.org/w/api.php?${params}`, {}, signal) as CommonsResponse;
  const pages = data?.query?.pages;
  if (Array.isArray(pages)) {
    for (const page of pages.slice(0, 6)) {
      const file = commonsFile(page.title);
      if (!file) continue;
      try { return creditedPhoto(file, page.imageinfo?.[0]); } catch { /* Try another credited raster in the linked category. */ }
    }
  }
  throw mainError('unavailable');
}
type Statement = { rank?: string; mainsnak?: { snaktype?: string; datavalue?: { type?: string; value?: unknown } } };
function statementString(statements?: Statement[]) {
  if (!Array.isArray(statements)) return;
  const valid = statements.filter(s => s.rank !== 'deprecated' && s.mainsnak?.snaktype === 'value' && s.mainsnak?.datavalue?.type === 'string');
  const preferred = valid.find(s => s.rank === 'preferred') ?? valid[0];
  return text(preferred?.mainsnak?.datavalue?.value, 230);
}
export async function resolveOsmPhoto(source: OsmPhotoSource, fetcher: ProviderFetch, signal: AbortSignal): Promise<DisplayPhoto> {
  async function optional<T>(load: () => Promise<T>): Promise<T | undefined> {
    try { return await load(); } catch (error) {
      // Cancellation and throttling must stop the whole lookup, not start another request.
      if ((error as { name?: string }).name === 'AbortError' || (error as { code?: string }).code === 'rate-limit') throw error;
      return undefined;
    }
  }
  if (source.file) {
    const photo = await optional(() => loadCommonsPhoto(source.file!, fetcher, signal));
    if (photo) return photo;
  }
  let category = source.category;
  if (source.wikidata) {
    if (!/^Q[1-9]\d{0,15}$/.test(source.wikidata)) throw mainError('invalid-selection');
    const params = new URLSearchParams({ action: 'wbgetentities', format: 'json', ids: source.wikidata, props: 'claims', maxlag: '5' });
    const entity = await optional(async () => {
      const data = await providerJson(fetcher, `https://www.wikidata.org/w/api.php?${params}`, {}, signal) as {
        entities?: Record<string, { claims?: { P18?: Statement[]; P373?: Statement[] } }>;
      };
      return data?.entities?.[source.wikidata!];
    });
    const image = statementString(entity?.claims?.P18);
    const file = image && commonsFile(`File:${image}`);
    if (file && file !== source.file) {
      const photo = await optional(() => loadCommonsPhoto(file, fetcher, signal));
      if (photo) return photo;
    }
    const name = statementString(entity?.claims?.P373);
    if (!category && name) category = commonsCategory(`Category:${name}`);
  }
  if (category && commonsCategory(category)) return categoryPhoto(category, fetcher, signal);
  throw mainError('unavailable');
}
