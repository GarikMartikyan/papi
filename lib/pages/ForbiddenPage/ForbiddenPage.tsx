import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import { PAPI_ROUTES } from '../../routing/routes.constants';

export type ForbiddenPageProps = ResultProps;

/**
 * Закрытый раздел.
 *
 * Стоит внутри каркаса, как и 404: человек вошёл в панель, просто попал туда,
 * куда ему нельзя, — и уйти оттуда он должен по навигации, а не по кнопке
 * «назад» в браузере.
 *
 * Ведёт на корень, а не на конкретный раздел: какой раздел у панели первый,
 * знает `PapiRouter`, и с корня он уводит туда сам.
 */
export const ForbiddenPage = (props: ForbiddenPageProps) => {
  const t = usePapiTranslation();

  return (
    <Result
      status="403"
      title={t('access denied')}
      subTitle={t('you have no access to this')}
      extra={
        <Link to={PAPI_ROUTES.home}>
          <Button type="primary">{t('back to the panel')}</Button>
        </Link>
      }
      {...props}
    />
  );
};
