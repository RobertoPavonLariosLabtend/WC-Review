import type { DisplayPhoto, EstablishmentDetails, PlaceSelection } from '../domain/models.ts';
import type { MainUseCases } from '../use-cases/index.ts';
export type SelectionState = { selection: PlaceSelection; loading: boolean; details?: EstablishmentDetails; photo?: DisplayPhoto; photoLoading?: boolean; error?: boolean } | null;

// Each screen/session owns a loader. Invalidated responses can never publish.
export function createSelectionLoader(cases: MainUseCases, publish: (state: SelectionState) => void) {
  let generation = 0;
  let controller: AbortController | undefined;
  function invalidate() { generation++; controller?.abort(); }
  return {
    clear() { invalidate(); publish(null); },
    dispose: invalidate,
    async select(input: PlaceSelection) {
      const selection = cases.select(input);
      invalidate();
      const current = generation;
      controller = new AbortController();
      const signal = controller.signal;
      const active = () => current === generation && !signal.aborted;
      publish({ selection, loading: true });
      try {
        const details = await cases.getDetails(selection.placeId, signal);
        if (!active()) return;
        const state = { selection, loading: false, details };
        publish({ ...state, photoLoading: !!details.photo });
        if (details.photo) {
          try {
            const photo = await cases.getPhoto(selection.placeId, details.photo, signal);
            if (active()) publish({ ...state, photo });
          } catch { if (active()) publish(state); }
        }
      } catch { if (active()) publish({ selection, loading: false, error: true }); }
    },
  };
}
