import { injectSlices, type RootState, type StateOf } from '@papi/store';

// TODO: заглушка — своих слайсов у панели пока нет. Наполнится, когда появится
// раздел со состоянием, которое переживает уход со страницы.
export const appSlices = injectSlices([]);

export type AppState = RootState & StateOf<typeof appSlices>;
