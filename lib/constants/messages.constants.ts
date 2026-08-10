import type { MessageDescriptor } from 'react-intl';

/**
 * Строки самого ядра: ошибки запросов, вход, ненайденная страница.
 *
 * Каталога языков у ядра нет и быть не может — языки целиком задаёт панель
 * (см. `I18nConfig`). Поэтому каждая строка едет парой: `id` для перевода и
 * `defaultMessage` на случай, если такого ключа в каталоге панели нет.
 *
 * `defaultMessage` — не заглушка, а английский текст ядра. Панель переводит
 * строку, дописав ключ в свой каталог; не дописала — увидит английский, но не
 * голый `papi.error.network` вместо надписи.
 *
 * В `en.json` панели эти ключи намеренно не продублированы: английский текст
 * уже здесь, и вторая копия рано или поздно разойдётся с первой.
 */
export const PAPI_MESSAGES = {
  errorNetwork: {
    id: 'papi.error.network',
    defaultMessage: 'No connection to the server',
  },
  errorTimeout: {
    id: 'papi.error.timeout',
    defaultMessage: 'The server took too long to answer',
  },
  errorParse: {
    id: 'papi.error.parse',
    defaultMessage: 'The server sent an answer we could not read',
  },
  errorUnauthorized: {
    id: 'papi.error.unauthorized',
    defaultMessage: 'The session has ended — please sign in again',
  },
  errorForbidden: {
    id: 'papi.error.forbidden',
    defaultMessage: 'You have no access to this',
  },
  errorNotFound: {
    id: 'papi.error.notFound',
    defaultMessage: 'Nothing found at this address',
  },
  errorServer: {
    id: 'papi.error.server',
    defaultMessage: 'The server failed to handle the request',
  },
  errorUnknown: {
    id: 'papi.error.unknown',
    defaultMessage: 'Something went wrong',
  },
  /*
   * Тост на удачную мутацию с `showSuccess: true`, когда бэкенд не прислал
   * своего текста. Нарочно ни о чём: ядро не знает, что именно случилось, —
   * эндпоинту, которому нужна точная формулировка, вместо `true` передаётся
   * своя строка.
   */
  successDefault: {
    id: 'papi.success.default',
    defaultMessage: 'Done',
  },
  loginTitle: {
    id: 'papi.login.title',
    defaultMessage: 'Sign in',
  },
  loginEmail: {
    id: 'papi.login.email',
    defaultMessage: 'Email',
  },
  loginEmailRequired: {
    id: 'papi.login.emailRequired',
    defaultMessage: 'Enter your email',
  },
  loginEmailInvalid: {
    id: 'papi.login.emailInvalid',
    defaultMessage: 'This does not look like an email',
  },
  loginPassword: {
    id: 'papi.login.password',
    defaultMessage: 'Password',
  },
  loginPasswordRequired: {
    id: 'papi.login.passwordRequired',
    defaultMessage: 'Enter your password',
  },
  loginSubmit: {
    id: 'papi.login.submit',
    defaultMessage: 'Sign in',
  },
  /*
   * Экран гарда: сессия есть, но подтвердить её не вышло — бэкенд не ответил
   * или ответил ошибкой. Про сам токен здесь не говорится ни слова намеренно: с
   * ним всё может быть в порядке, а лежать — сервер.
   */
  sessionTitle: {
    id: 'papi.session.title',
    defaultMessage: 'We could not confirm your session',
  },
  sessionRetry: {
    id: 'papi.session.retry',
    defaultMessage: 'Try again',
  },
  sessionSignOut: {
    id: 'papi.session.signOut',
    defaultMessage: 'Sign out',
  },
  notFoundTitle: {
    id: 'papi.notFound.title',
    defaultMessage: 'Page not found',
  },
  notFoundText: {
    id: 'papi.notFound.text',
    defaultMessage: 'The address is wrong, or the page has moved',
  },
  notFoundBack: {
    id: 'papi.notFound.back',
    defaultMessage: 'Back to the panel',
  },
  /*
   * Подписи каркаса — `aria-label` у элементов без видимого текста.
   *
   * Раньше их передавала панель пропсами (`localeSelectLabel` и соседи), потому
   * что переводить внутри ядру было нечем. Теперь есть: строка берётся здесь, а
   * компонент читает её сам. Панели, которой нужна своя, остаётся `aria-label` —
   * он приходит через `...rest` и перекрывает эту.
   */
  layoutChangeLanguage: {
    id: 'papi.layout.changeLanguage',
    defaultMessage: 'Change language',
  },
  layoutToggleTheme: {
    id: 'papi.layout.toggleTheme',
    defaultMessage: 'Toggle colour scheme',
  },
  layoutToggleSidebar: {
    id: 'papi.layout.toggleSidebar',
    defaultMessage: 'Toggle sidebar',
  },
  layoutAccountMenu: {
    id: 'papi.layout.accountMenu',
    defaultMessage: 'Account menu',
  },
} as const satisfies Record<string, MessageDescriptor>;
