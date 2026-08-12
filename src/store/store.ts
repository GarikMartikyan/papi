import { injectSlices, type RootState, type StateOf } from '@papi/store';

import { usersSlice } from './slices/users.slice';

/**
 * Слайсы панели в сторе papi.
 *
 * Свой стор панель не создаёт: он один и живёт в ядре, `injectSlices` только
 * докладывает в него редьюсеры. Модуль должен быть загружен до первого рендера —
 * это обеспечивает импорт из страниц (`UsersPage`). Понадобится страница без
 * слайсов панели — импорт придётся добавить в `main.tsx` явно.
 */
export const appSlices = injectSlices([usersSlice]);

/**
 * Состояние панели: ядро (`config`, `api`) плюс собственные слайсы.
 *
 * Выводится из результата инжекта, поэтому руками не описывается и не разъедется
 * при добавлении слайса.
 */
export type AppState = RootState & StateOf<typeof appSlices>;

/**
 * Селекторы берутся у инжектированного слайса, а не у `usersSlice` напрямую:
 * стор уже создан, и до первого dispatch ключа `users` в состоянии нет —
 * обычный селектор на этом падает, а этот подставит начальное состояние.
 */
export const { selectSelectedUserId, selectSearch } = appSlices.users.selectors;
