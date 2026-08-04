import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { PAPI_MESSAGES } from '../../constants/messages.constants';
import { useTranslation } from '../../hooks/useTranslation';
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
  const t = useTranslation();

  return (
    <Result
      status="404"
      title={t(PAPI_MESSAGES.notFoundTitle)}
      subTitle={t(PAPI_MESSAGES.notFoundText)}
      extra={
        <Link to={PAPI_ROUTES.home}>
          <Button type="primary">{t(PAPI_MESSAGES.notFoundBack)}</Button>
        </Link>
      }
      {...props}
    />
  );
};
