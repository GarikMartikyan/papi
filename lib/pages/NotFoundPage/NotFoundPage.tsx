import { Button, Result, type ResultProps } from 'antd';
import { Link } from 'react-router';

import { SplashScreen } from '../../components/shared/SplashScreen';
import { papiRoutes } from '../../constants/routes.constants';
import { usePapiTranslation } from '../../hooks/usePapiTranslation';

/**
 * Пропсы `NotFoundPage`: логотип плюс пропсы `Result` из antd — ими панель
 * перебивает заголовок, подпись и кнопку.
 */
export interface NotFoundPageProps extends ResultProps {
  /**
   * Логотип панели: страница стоит вместо каркаса, поэтому обрамление — и лицо
   * вместе с ним — приходит сюда, а не берётся из шапки.
   *
   * Ссылкой на картинку, как и у `MainLayout`.
   *
   * @defaultValue Большой логотип ядра — тот, которым `SplashScreen`
   * обходится без этого пропа. Знак панели сюда, в отличие от шапки, сам не
   * приезжает: страница отдаёт `logo` в `SplashScreen` как есть.
   */
  logo?: string;
}

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
 *
 * Ставит её `PapiRouter` сам — на всё, что не совпало ни с одним маршрутом.
 * Отдельно она нужна там, где панель показывает «не найдено» внутри своего
 * маршрута: запись, которой нет.
 *
 * @example
 * ```tsx
 * if (isNotFound) return <NotFoundPage subTitle="Такого пользователя нет" />;
 * ```
 */
export const NotFoundPage = (props: NotFoundPageProps) => {
  const { logo, ...rest } = props;

  const t = usePapiTranslation();

  return (
    <SplashScreen logo={logo}>
      <Result
        status="404"
        title={t('page not found')}
        subTitle={t('the address is wrong, or the page has moved')}
        extra={
          <Link to={papiRoutes.home}>
            <Button type="primary">{t('back to the panel')}</Button>
          </Link>
        }
        {...rest}
      />
    </SplashScreen>
  );
};
