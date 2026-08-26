import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { papiRoutes } from '../../constants/routes.constants';
import { usePapiTranslation } from '../../hooks/usePapiTranslation';

/**
 * Пропсы `ServerErrorPage` — пропсы `Result` из antd как есть: своих у страницы
 * нет, а заголовок, подпись и кнопку панель при желании перебивает ими.
 */
export type ServerErrorPageProps = ResultProps;

/**
 * Сервер не справился.
 *
 * Кнопка уводит на корень, а не повторяет запрос: страница не знает, что именно
 * упало, — её показывают вместо содержимого раздела, а перезапросом занимается
 * тот, кто этот запрос делал (так, экран подтверждения сессии в
 * `PapiRouterLayout` рисует «Повторить» сам).
 *
 * Ядро её нигде не ставит: своих маршрутов на 500 у панели нет, и страница
 * существует ради панели — на месте упавшего содержимого или в `ErrorBoundary`.
 *
 * @example
 * ```tsx
 * const { isError, refetch } = useGetReportsQuery();
 *
 * if (isError) {
 *   return <ServerErrorPage extra={<Button onClick={refetch}>Повторить</Button>} />;
 * }
 * ```
 */
export const ServerErrorPage = (props: ServerErrorPageProps) => {
  const t = usePapiTranslation();

  return (
    <Result
      status="500"
      title={t('server error')}
      subTitle={t('the server failed to handle the request')}
      extra={
        <Link to={papiRoutes.home}>
          <Button type="primary">{t('back to the panel')}</Button>
        </Link>
      }
      {...props}
    />
  );
};
