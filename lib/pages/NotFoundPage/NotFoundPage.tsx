import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import { PAPI_ROUTES } from '../../routing/routes.constants';

export type NotFoundPageProps = ResultProps;

/**
 * Ненайденный адрес.
 *
 * Стоит внутри каркаса, а не вместо него: человек попал не туда внутри панели,
 * и навигация — единственное, чем ему тут можно помочь. Заменяется своей через
 * `notFoundElement` у `PapiRouter`.
 *
 * Ведёт на корень, а не на конкретный раздел: какой раздел у панели первый,
 * знает `PapiRouter`, и с корня он уводит туда сам.
 */
export const NotFoundPage = (props: NotFoundPageProps) => {
  const t = usePapiTranslation();

  return (
    <Result
      status="404"
      title={t('page not found')}
      subTitle={t('the address is wrong, or the page has moved')}
      extra={
        <Link to={PAPI_ROUTES.home}>
          <Button type="primary">{t('back to the panel')}</Button>
        </Link>
      }
      {...props}
    />
  );
};
