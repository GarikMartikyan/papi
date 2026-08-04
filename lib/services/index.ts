/**
 * Services — framework-agnostic logic: env variables, token storage, permissions.
 *
 * `locales.service` наружу не выходит: это мостик между `I18nProvider` и
 * `useLocale`, и заполняет его провайдер. Панель свой список языков и так
 * держит у себя — она же передаёт его в `PapiProvider`.
 */

export * from './env.service';
export * from './localStorage.service';
export * from './sessionStorage.service';
