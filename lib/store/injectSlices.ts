import type { Slice } from '@reduxjs/toolkit';

import { warn } from '../utils/logger.util';

import { rootReducer } from './reducers';

/**
 * Пути, которые занимает само ядро: на них держатся тема, язык и запросы.
 *
 * Выводится из самого `rootReducer`, а не пишется руками: когда ядро займёт
 * новый путь, тип обновится сам, а `satisfies` заставит дописать рантайм-список
 * — иначе papi просто не соберётся.
 */
export type ReservedReducerPath = keyof ReturnType<typeof rootReducer>;

const RESERVED_REDUCER_PATHS = new Set<string>(
  Object.keys({ config: true, api: true } satisfies Record<ReservedReducerPath, true>),
);

/**
 * Слайсы панели, разложенные по `reducerPath`.
 *
 * Тип берётся у исходного слайса, а не у результата `injectInto`: тот объявляет
 * `injectInto` дженериком по пути, и `ReturnType` подставляет вместо литерала
 * весь `string` — селекторы получают индексную сигнатуру
 * (`{ [x: string]: UsersState | undefined }`), под которую не подходит ни одно
 * реальное состояние. Разница только в типах: в рантайме здесь лежит именно
 * инжектированный слайс с безопасными селекторами.
 *
 * Занятые ядром пути исключены: в рантайме их пропускает `injectSlices`, и без
 * `Exclude` тип обещал бы ключ, которого в объекте нет, — обращение к нему
 * проходило бы тайпчек и падало на первом же чтении.
 */
export type InjectedSlices<Slices extends readonly Slice[]> = {
  [S in Slices[number] as Exclude<S['reducerPath'], ReservedReducerPath>]: S;
};

/** Состояние, которое добавляют слайсы: `RootState & StateOf<typeof appSlices>`. */
export type StateOf<Slices> = {
  [Path in keyof Slices]: Slices[Path] extends { getInitialState: () => infer State }
    ? State
    : never;
};

/**
 * Подключает слайсы панели к стору ядра.
 *
 * Идёт через `slice.injectInto`, а не `rootReducer.inject`, ради селекторов:
 * стор уже создан, поэтому до первого dispatch ключа слайса в состоянии нет, и
 * обычный селектор из `slice.selectors` получит `undefined` и упадёт. После
 * `injectInto` селекторы подставляют начальное состояние слайса.
 *
 * Проверка на занятые пути нужна в рантайме: `injectInto` принимает `injectable`
 * нетипизированно, поэтому защита `rootReducer.inject` на уровне типов здесь не
 * срабатывает.
 */
export const injectSlices = <const Slices extends readonly Slice[]>(
  slices: Slices,
): InjectedSlices<Slices> => {
  const injected: Record<string, unknown> = {};

  for (const slice of slices) {
    if (RESERVED_REDUCER_PATHS.has(slice.reducerPath)) {
      warn(`Reducer path "${slice.reducerPath}" is taken by the core — slice skipped.`);
      continue;
    }

    injected[slice.reducerPath] = slice.injectInto(rootReducer);
  }

  return injected as InjectedSlices<Slices>;
};
