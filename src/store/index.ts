import { injectSlices, type RootState, type StateOf } from '@papi/store';

/*
 * TODO: заглушка — слайсов у скелета нет. Панель заводит свои в
 * `src/store/slices` и перечисляет их здесь: `injectSlices([usersSlice])`.
 */

/**
 * Слайсы панели в сторе ядра.
 *
 * Свой стор панель не создаёт: он один и живёт в ядре, `injectSlices` только
 * докладывает в него редьюсеры. Модуль должен быть загружен до первого рендера
 * — обычно это обеспечивает импорт из страницы, которая слайс читает.
 */
export const appSlices = injectSlices([]);

/**
 * Состояние панели: ядро (`config`, `api`) плюс собственные слайсы.
 *
 * Выводится из результата инжекта, поэтому руками не описывается и не разъедется
 * при добавлении слайса.
 */
export type AppState = RootState & StateOf<typeof appSlices>;
