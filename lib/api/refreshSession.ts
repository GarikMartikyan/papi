import type { BaseQueryApi } from '@reduxjs/toolkit/query';

import { getPanelKey } from '../services/env.service';
import { getRefreshTokenLS } from '../services/localStorage.service';
import { loggedOut, tokensRotated } from '../store/slices/auth.slice';
/*
 * Тип, а не значение, и из `types/`, а не из `auth.api`: значение оттуда
 * замкнуло бы круг `api → baseQuery → refreshSession → auth.api → api`. Круг
 * из одних типов безвреден — `import type` стирается на сборке, — а круг из
 * значений роняет приложение на старте: `auth.api` зовёт
 * `api.injectEndpoints` в момент, когда сам `api` ещё не создан. Ни tsc, ни
 * сборка этого не видят: бандлер код не выполняет.
 */
import type { AuthTokens } from '../types/interfaces/auth.interface';

import { fetchQuery } from './fetchQuery';

const REFRESH_URL = '/auth/refresh';

/**
 * Заголовок, которым панель называет себя при обновлении сессии.
 *
 * На входе для этого есть поле `panelKey` в теле, а у ротации тело — один
 * токен, и панель бэкенд читает отсюда. Живёт рядом с единственным своим
 * потребителем, а не в `auth.api`: там она стала бы тем самым ребром-значением,
 * которое замыкает круг импортов.
 */
const ADMIN_PANEL_KEY_HEADER = 'x-admin-panel-key';

/**
 * Идущая ротация — или `null`, когда её нет.
 *
 * Модульная переменная, а не поле в сторе: читать её нужно синхронно, в момент
 * решения «начать свою или подождать чужую», и подписка на стор здесь была бы
 * лишним кругом.
 */
let pending: Promise<boolean> | null = null;

/** Ответ бэкенда приходит извне, поэтому форму пары проверяем, а не объявляем. */
const isAuthTokens = (value: unknown): value is AuthTokens => {
  if (typeof value !== 'object' || value === null) return false;

  const { accessToken, refreshToken } = value as Partial<AuthTokens>;

  return typeof accessToken === 'string' && typeof refreshToken === 'string';
};

/**
 * Тот же контекст, но со своим сигналом отмены.
 *
 * Ротацию запускает чей-то конкретный запрос, и его `signal` прервал бы её
 * вместе с ним — например когда страницу закрыли или сбросили состояние api.
 * А ждут результата к этому времени уже другие запросы, и главное: на бэкенде
 * токен обновления к моменту отмены может быть **уже потрачен**. Оборвав ответ,
 * мы не сохранили бы новую пару и в следующий раз предъявили бы потраченный
 * токен — то есть выглядели бы как кража и потеряли всю семью. Ротация должна
 * пережить того, кто её начал.
 */
const detachSignal = (api: BaseQueryApi): BaseQueryApi => ({
  ...api,
  signal: new AbortController().signal,
  abort: () => undefined,
});

const runRefresh = async (api: BaseQueryApi): Promise<boolean> => {
  const refreshToken = getRefreshTokenLS();

  /* Продлевать нечем — сессия кончилась ещё до запроса. */
  if (refreshToken === null || refreshToken === '') {
    api.dispatch(loggedOut());

    return false;
  }

  const result = await fetchQuery(
    {
      url: REFRESH_URL,
      method: 'POST',
      body: { refreshToken },
      /* Ручка публичная, но панель себя называет: из этого заголовка бэкенд
         берёт, для какой панели выписать новый токен доступа. */
      headers: { [ADMIN_PANEL_KEY_HEADER]: getPanelKey() },
    },
    detachSignal(api),
    {},
  );

  if (result.error !== undefined || !isAuthTokens(result.data)) {
    api.dispatch(loggedOut());

    return false;
  }

  api.dispatch(
    tokensRotated({
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    }),
  );

  return true;
};

/**
 * Продлить сессию: обменять токен обновления на новую пару.
 *
 * Одна ротация на всех: пока запрос идёт, следующие вызовы получают тот же
 * промис и ждут его, а не начинают свою. Это не экономия запросов, а
 * обязательное условие — токен обновления одноразовый, и второй запрос
 * предъявил бы уже потраченный. Бэкенд считает такое кражей и отзывает **всю
 * семью** токенов сессии, то есть выкидывает человека из всех вкладок сразу.
 * А панель на старте отправляет несколько запросов разом, и 401 они получают
 * тоже разом.
 *
 * Неудача — это конец сессии, и `loggedOut` диспатчится отсюда: продлить не
 * вышло, значит следующий запрос всё равно нечем подписать. `PapiRouter` следит
 * за стором и уводит на вход сам.
 *
 * Панель её не зовёт — ротацию запускает `papiBaseQuery`, получив 401.
 *
 * @param api Контекст RTK Query: нужен `dispatch`, чтобы записать новую пару.
 * @returns `true` — пара обновлена, запрос можно повторить; `false` — сессия
 * закончилась.
 */
export const refreshSession = (api: BaseQueryApi): Promise<boolean> => {
  /*
   * Неудача ротации — это `false`, и `catch` держит это обещание даже когда
   * бросили, а не вернули ошибку. `fetchQuery` разбирает в `{ error }` только
   * сеть и статус; кривой ключ панели (`VITE_PANEL_KEY`) роняет ещё `new
   * Headers`, а кривой адрес (`VITE_API_BASE_URL`) — `new Request`, и оба
   * броска проходят мимо его разбора.
   *
   * Ловим здесь, а не в `runRefresh`, потому что беречь надо именно общий
   * промис: его ждут все запросы, поймавшие 401 разом, а `papiBaseQuery` зовёт
   * `refreshSession` без `catch`. Без этого одна такая ошибка отклонила бы всю
   * очередь — вместо того чтобы закончить сессию и увести на вход.
   */
  pending ??= runRefresh(api)
    .catch(() => {
      api.dispatch(loggedOut());

      return false;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
};
