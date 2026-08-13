/**
 * Pages — экраны, которые ядро возит с собой: вход и страницы-результаты.
 *
 * Вход, 404 и 403 на закрытом разделе `PapiRouter` ставит сам, поэтому панели
 * импортировать их обычно не нужно. Барель существует ради второго случая:
 * панель показывает вход в своём обрамлении или рисует результат внутри
 * собственного маршрута — 500 вместо упавшего содержимого, тот же 403 на чём-то
 * своём.
 */

export * from './ForbiddenPage/ForbiddenPage';
export * from './LoginPage/LoginPage';
export * from './NotFoundPage/NotFoundPage';
export * from './ServerErrorPage/ServerErrorPage';
