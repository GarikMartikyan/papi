/**
 * Pages — экраны, которые ядро возит с собой: вход и страницы-результаты.
 *
 * Вход и 404 `PapiRouter` ставит сам, поэтому панели импортировать их обычно не
 * нужно. Барель существует ради второго случая: панель показывает вход в своём
 * обрамлении или рисует результат внутри собственного маршрута — 403 на
 * закрытом разделе, 500 вместо упавшего содержимого.
 */

export * from './ForbiddenPage/ForbiddenPage';
export * from './LoginPage/LoginPage';
export * from './NotFoundPage/NotFoundPage';
export * from './ServerErrorPage/ServerErrorPage';
