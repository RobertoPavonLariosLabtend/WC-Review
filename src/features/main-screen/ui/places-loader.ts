import type { PlaceBounds, PlaceSelection } from '../domain/models.ts';
import type { MainUseCases } from '../use-cases/index.ts';

export type PlacesState = { places: PlaceSelection[]; loading: boolean; error?: string };
export function createPlacesLoader(cases: MainUseCases, publish: (state: PlacesState) => void) {
  let generation = 0;
  let controller: AbortController | undefined;
  let places: PlaceSelection[] = [];
  function invalidate() { generation++; controller?.abort(); }
  return {
    dispose: invalidate,
    async search(bounds: PlaceBounds) {
      invalidate();
      const current = generation;
      controller = new AbortController();
      const signal = controller.signal;
      const active = () => current === generation && !signal.aborted;
      publish({ places, loading: true });
      try {
        const results = await cases.listPlaces(signal, bounds);
        if (active()) { places = results; publish({ places, loading: false }); }
      } catch (error) {
        if (active()) publish({ places, loading: false, error: (error as { code?: string }).code ?? 'unavailable' });
      }
    },
  };
}
