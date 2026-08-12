import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { SplashScreen } from '../../components/shared/SplashScreen';
import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import { PAPI_ROUTES } from '../../routing/routes.constants';

export type NotFoundPageProps = ResultProps;

/**
 * Ненайденный адрес.
 *
 * Стоит вместо каркаса, а не внутри: такого адреса у панели нет, а значит нет и
 * раздела, в котором человек находится, — и подсвечивать в меню было бы нечего.
 * Шапка с навигацией вокруг пустого места в этом случае обманывает: выглядит
 * так, будто страница есть, просто не загрузилась.
 *
 * Экран на всё окно приходит от `SplashScreen` — тем же местом, что ожидание
 * сессии и экран ошибки гарда, и по той же причине: `100vh` держит `MainLayout`,
 * а вне его высоту странице нужно задать самой.
 *
 * Обрамление ставит сама страница, а не маршрут вокруг неё, — как и на входе:
 * панель, подменившая 404 своим `notFoundElement` у `PapiRouter`, получает
 * пустое окно и распоряжается им как хочет.
 *
 * Ведёт на корень, а не на конкретный раздел: какой раздел у панели первый,
 * знает `PapiRouter`, и с корня он уводит туда сам.
 */
export const NotFoundPage = (props: NotFoundPageProps) => {
  const t = usePapiTranslation();

  return (
    <SplashScreen>
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
    </SplashScreen>
  );
};
