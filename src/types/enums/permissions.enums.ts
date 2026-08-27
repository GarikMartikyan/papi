// TODO: заглушка — право взято под единственный раздел скелета. Панель заменяет
// набор своим, когда бэкенд объявит его: у papi-authority права приезжают в
// claims токена как `<section>.<key>`.
export enum Permission {
  VIEW_SETTINGS = 'view_settings',
}
