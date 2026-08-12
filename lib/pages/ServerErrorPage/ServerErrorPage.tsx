import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import { PAPI_ROUTES } from '../../routing/routes.constants';

export type ServerErrorPageProps = ResultProps;

/**
 * Сервер не справился.
 *
 * Кнопка уводит на корень, а не повторяет запрос: страница не знает, что именно
 * упало, — её показывают вместо содержимого раздела, а перезапросом занимается
 * тот, кто этот запрос делал (так, экран подтверждения сессии в
 * `PapiRouterLayout` рисует «Повторить» сам).
 */
export const ServerErrorPage = (props: ServerErrorPageProps) => {
  const t = usePapiTranslation();

  return (
    <Result
      status="500"
      title={t('server error')}
      subTitle={t('the server failed to handle the request')}
      extra={
        <Link to={PAPI_ROUTES.home}>
          <Button type="primary">{t('back to the panel')}</Button>
        </Link>
      }
      {...props}
    />
  );
};
