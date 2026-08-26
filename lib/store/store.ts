import { configureStore } from '@reduxjs/toolkit';

import { api } from '../api/api';

import { rootReducer } from './reducers';

/**
 * Стор ядра — синглтон: панель его не создаёт и не передаёт, а дополняет
 * (`injectSlices` для слайсов, `injectEndpoints` для запросов).
 *
 * В `Provider` его ставит `StoreProvider`; напрямую он нужен там, где до стора
 * нужно дотянуться вне React, — например `store.dispatch(loggedOut())`.
 */
export const store = configureStore({
  reducer: rootReducer,
  // Единственное место, где регистрируется middleware api: после создания стора
  // его уже не добавить, поэтому панель и не создаёт свой api.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  // Литерал, чтобы бандлер вырезал подключение devtools из прод-сборки панели.
  // `import.meta.env`, а не `process.env`: собирает Vite, и он подставляет сюда
  // константу, — а `process` в браузере просто не существует.
  devTools: import.meta.env.DEV,
});

/**
 * `dispatch` стора ядра. Готовый типизированный хук — `useAppDispatch`, этот тип
 * нужен для своих: `createAsyncThunk`, обёрток, тестов.
 */
export type AppDispatch = typeof store.dispatch;

/** Сам стор — для мест, где его передают параметром: тесты, сторибук. */
export type AppStore = typeof store;

/**
 * Состояние ядра: `config` и `api`.
 *
 * Выводится из стора, а не описывается руками, — иначе `api` пришлось бы
 * держать в синхронизации вручную. Состояние со слайсами панели собирается на
 * её стороне: `RootState & StateOf<typeof appSlices>`.
 *
 * @example
 * ```ts
 * // src/store/store.ts
 * export type AppState = RootState & StateOf<typeof appSlices>;
 * ```
 */
export type RootState = ReturnType<typeof store.getState>;
