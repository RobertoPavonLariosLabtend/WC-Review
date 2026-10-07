import { mainError } from '../domain/models.ts';

export type ProviderFetch = typeof fetch;
export function checkSignal(signal: AbortSignal) {
  if (signal.aborted) throw Object.assign(new Error('Carga cancelada'), { name: 'AbortError' });
}
export async function providerJson(fetcher: ProviderFetch, url: string, options: RequestInit, signal: AbortSignal): Promise<unknown> {
  checkSignal(signal);
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort);
  // Overpass may wait for a free slot before its 20-second query budget starts.
  const timeout = setTimeout(abort, 45000);
  try {
    const response = await fetcher(url, {
      ...options,
      headers: { Accept: 'application/json', 'User-Agent': 'WCReview/1.0 (+https://github.com/RobertoPavonLariosLabtend/WC-Review)', ...options.headers },
      signal: controller.signal,
    });
    checkSignal(signal);
    if (response.status === 429 || response.status === 406) throw mainError('rate-limit');
    if (!response.ok) throw mainError('unavailable');
    const result: unknown = await response.json();
    checkSignal(signal);
    return result;
  } catch (error) {
    checkSignal(signal);
    if ((error as { code?: string }).code === 'rate-limit') throw error;
    throw mainError('unavailable');
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
