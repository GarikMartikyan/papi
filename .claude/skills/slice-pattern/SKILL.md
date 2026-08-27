---
name: slice-pattern
description: >
  How papi keeps panel state — one file per slice, the state interface in types/interfaces,
  localStorage written straight from the reducer, selectors declared inside createSlice, panel
  slices attached through injectSlices, and the main rule: actions and selectors leave the file
  as one destructuring with the JSDoc written inside the pattern — nothing is exported one by
  one. Use whenever you add or edit a *.slice.ts file, put panel state into the store, or review
  slice code. Triggers: adding a file under src/store/slices or lib/store/slices, "напиши слайс",
  "добавь состояние", "add a slice", "createSlice", "как экспортировать экшены", "селекторы
  слайса", "initialState", "injectSlices", "useAppSelector", "состояние переживает уход со
  страницы".
---

# slice-pattern — как писать слайсы в papi

Главное правило этого скилла одно: **всё, что слайс отдаёт наружу, уходит одной деструктуризацией**
— отдельным блоком экшены, отдельным селекторы. Хвост файла тогда читается как список того, что
файл отдаёт, а не как россыпь одиночных экспортов. Тем же паттерном отдаёт хуки `*.api.ts` — скилл
[api-endpoint-pattern](../api-endpoint-pattern/SKILL.md).

## Слайс — про панель, а не про бэкенд

В слайсе живёт то, чего нет на сервере: сессия, тема, язык, положение сайдбара, состояние мастера
или фильтров, которое должно пережить уход со страницы.

Ответ бэкенда в слайс не кладётся **никогда** — его держит кеш RTK Query, и он же знает, когда
данные устарели. Скопированный в слайс, ответ становится вторым источником правды: кеш обновился
после мутации, копия — нет, и расхождение видно только на экране.

## Один файл — один слайс

Ядро кладёт файл в `lib/store/slices/<entity>.slice.ts` и добавляет его в баррель
`lib/store/slices/index.ts`. Панель — в `src/store/slices/<entity>.slice.ts`, барреля у неё нет.

Внутри файла порядок фиксированный, сверху вниз: начальное состояние → сам `createSlice`
(`reducers`, за ними `selectors`) → экспорт экшенов → экспорт селекторов. Тот же порядок, в каком
это читают: сначала что хранится, потом что меняет, в конце что отдаётся наружу.

## Состояние — интерфейсом в `types/`

Интерфейс состояния объявляется в папке типов своего слоя —
`lib/types/interfaces/<entity>State.interface.ts` у ядра, `src/types/interfaces/…` у панели, — а
слайс его импортирует. `interface` в `*.slice.ts` не объявляется: состояние читают ещё и хуки, и
пропсы, и тесты, и брать его из файла слайса им незачем.

Начальное состояние — отдельная экспортируемая константа, а не литерал внутри `createSlice`:

```ts
export const authInitialState: AuthState = {
  accessToken: getAccessTokenLS(),
  refreshToken: getRefreshTokenLS(),
};
```

Аннотация `: AuthState` обязательна — без неё tsc выведет тип по значению, и поле, потерянное в
интерфейсе, не всплывёт. Имя константы — `<entity>InitialState`: её берут тесты и сброс состояния.

## Редьюсер пишет и в хранилище

Побочный эффект в редьюсере здесь намеренный: тема, язык, положение сайдбара и токены сохраняются
прямо в теле экшена. Тогда сохранение не зависит от того, кто его задиспатчил, — форма входа,
`baseQuery` или пункт меню, — и не размазывается по эффектам в компонентах.

Состояние правится на месте (immer внутри `createSlice` делает из этого новый объект):

```ts
setThemeMode(state, action: PayloadAction<ThemeMode>) {
  state.themeMode = action.payload;
  setThemeModeLS(action.payload);
},
```

Отсюда следствие: **то, что сохраняться не должно, ходит своим экшеном.** `setLocale` — выбор
пользователя, он уходит в localStorage; `syncLocale` — подбор ядра под список языков панели, и он
в хранилище не попадает. Два экшена с одинаковым телом, но разным смыслом — не дублирование:
разойтись им предстоит именно в побочном эффекте. Общее тело при этом выносится в функцию рядом с
слайсом (`applyTokens` в `auth.slice.ts`).

## Селекторы объявляются внутри `createSlice`

Не отдельными функциями от `RootState`, а полем `selectors` — состояние в них уже сужено до
слайса, и селектор не знает и не должен знать своего пути в сторе:

```ts
selectors: {
  selectThemeMode: (state) => state.themeMode,
},
```

Для слайса панели это ещё и единственный рабочий способ: `injectSlices` подключает слайс через
`slice.injectInto`, и после этого селекторы подставляют начальное состояние сами. Селектор,
написанный руками как `(state: AppState) => state.users.list`, до первого dispatch получит
`undefined` и упадёт.

Селектор — то место, где живёт вывод из состояния, а не только чтение поля:
`selectIsAuthenticated` отвечает на вопрос «вошёл ли», а не отдаёт токен. Считать это в компоненте
значит развести по экранам разные ответы на один вопрос.

## Экшены и селекторы — одной деструктуризацией

Два блока, в том же порядке, что и в самом `createSlice`:

```ts
export const { loggedIn, tokensRotated, loggedOut } = authSlice.actions;

export const { selectAccessToken, selectRefreshToken, selectIsAuthenticated } = authSlice.selectors;
```

По одному (`export const loggedIn = authSlice.actions.loggedIn;`) не экспортируется ничего. Такой
хвост растёт на десятки строк, список отдаваемого приходится собирать глазами по всему файлу, а
новый экшен легко дописать в `reducers` и забыть отдать наружу.

Экшены ядра и селекторы ядра публичны для всех панелей, и описание им нужно; пишется оно внутри
самого паттерна, над именем:

```ts
/* Экшены — одной деструктуризацией, описание каждого внутри паттерна. В
   подсказку редактора оно оттуда не попадает: JSDoc у элемента деструктуризации
   tsserver не берёт — описание читается здесь. */
export const {
  /**
   * Сессия началась: пара токенов ложится и в стор, и в localStorage.
   *
   * @param tokens Пара, которую вернул вход.
   */
  loggedIn,
  /** Сессия закончилась: оба токена убираются и из стора, и из localStorage. */
  loggedOut,
} = authSlice.actions;

/* Селекторы — тем же паттерном, что и экшены выше. */
export const {
  /** Вошёл ли пользователь. */
  selectIsAuthenticated,
} = authSlice.selectors;
```

Комментарий-заголовок пишется **один раз на файл**, у первого блока; второй на него ссылается —
повторять три строки объяснения дважды в одном файле незачем.

Цена у паттерна известная и принята: JSDoc у элемента деструктуризации tsserver в подсказку не
берёт, и на месте вызова панель увидит тип, но не описание — читается оно в самом файле слайса.
Экспорт по одному подсказку сохраняет, но рассыпает список того, что файл отдаёт, по всему хвосту;
выбран список.

Сам слайс тоже остаётся экспортированным (`export const authSlice = createSlice(…)`) — на него
ссылаются `reducers.ts` у ядра и `injectSlices` у панели.

## Регистрация слайса

| где | как |
|---|---|
| ядро | дописать в `combineSlices(authSlice, configSlice, api)` в `lib/store/reducers.ts` |
| панель | добавить в `injectSlices([...])` в `src/store/store.ts` |

Панель:

```ts
export const appSlices = injectSlices([usersSlice]);

export type AppState = RootState & StateOf<typeof appSlices>;
```

Свой `configureStore` панель не заводит: стор — синглтон ядра, и второй стор не увидят ни
`Provider`, ни middleware api. Пути `auth`, `config` и `api` заняты ядром — слайс с таким
`reducerPath` `injectSlices` пропустит с предупреждением в консоль и вычеркнет из типа `AppState`.

## Читают слайс хуки, а не компоненты напрямую

Одиночное чтение делается прямо в компоненте:

```tsx
const collapsed = useAppSelector(selectSidebarCollapsed);
```

Как только на одну задачу нужны и селектор, и экшен, и что-то поверх них — это хук
(`useThemeMode`, `useAuth`), и правила у него свои: скилл [hook-pattern](../hook-pattern/SKILL.md).

`useSelector`/`useDispatch` из `react-redux` напрямую не зовутся — только типизированные обёртки, и
берутся они **у своего слоя**: ядро зовёт `useAppSelector` из `lib/hooks`, панель — свой из
`src/hooks/useAppSelector.ts`. Разница в типе состояния: у ядра это `RootState`, у панели —
`AppState`, и только он знает про её собственные слайсы. Селектор панельного слайса, прочитанный
через `useAppSelector` ядра, не пройдёт по типу.

## Именование

| что | как |
|---|---|
| файл | `<entity>.slice.ts` — `auth.slice.ts` |
| слайс | `<entity>Slice` — `authSlice` |
| `name` внутри | тот же путь строкой — `'auth'`, он же `reducerPath` |
| начальное состояние | `<entity>InitialState` |
| интерфейс состояния | `<Entity>State` в `types/interfaces/<entity>State.interface.ts` |
| экшен-событие | `loggedIn`, `tokensRotated` — когда важно, что случилось |
| экшен-сеттер | `setThemeMode`, `toggleSidebar` — когда это прямое присваивание |
| селектор | `selectX`, вывод — `selectIsX` |

## Пример целиком

Слайс панели: фильтры списка, которые должны пережить уход со страницы.

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { OrderStatus } from '../../types/enums/orders.enums';
import type { OrdersFiltersState } from '../../types/interfaces/orders.interfaces';

export const ordersFiltersInitialState: OrdersFiltersState = {
  status: null,
  search: '',
};

export const ordersFiltersSlice = createSlice({
  name: 'ordersFilters',
  initialState: ordersFiltersInitialState,
  reducers: {
    statusPicked(state, action: PayloadAction<OrderStatus | null>) {
      state.status = action.payload;
    },
    searchTyped(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    filtersReset() {
      return ordersFiltersInitialState;
    },
  },
  selectors: {
    selectStatus: (state) => state.status,
    selectSearch: (state) => state.search,
    /* Вывод живёт в селекторе, а не в компоненте: кнопку «Сбросить» показывают
       два экрана, и считать «что-то выбрано» каждый по-своему они не должны. */
    selectHasFilters: (state) => state.status !== null || state.search !== '',
  },
});

export const { statusPicked, searchTyped, filtersReset } = ordersFiltersSlice.actions;

export const { selectStatus, selectSearch, selectHasFilters } = ordersFiltersSlice.selectors;
```

Панель описания в JSDoc не пишет — её экшены наружу не уезжают; в ядре у каждого имени внутри
деструктуризации стоит описание, как в разделе выше.

Подключается он одной строкой в `src/store/store.ts`:

```ts
export const appSlices = injectSlices([ordersFiltersSlice]);
```

Живые слайсы ядра — `lib/store/slices/auth.slice.ts` и `lib/store/slices/config.slice.ts`.
