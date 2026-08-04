import { Alert, Button, Card, type CardProps, Form, Input } from 'antd';
import { Navigate, useLocation } from 'react-router';

import { useLoginMutation } from '../../api/endpoints/auth.api';
import { PAPI_MESSAGES } from '../../constants/messages.constants';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../hooks/useTranslation';
import { PAPI_ROUTES, type PapiLoginState } from '../../routing/routes.constants';
import { toApiError } from '../../utils/apiError.util';

/** Ширина карточки: полей два, и шире они только растягиваются впустую. */
const CARD_WIDTH = 360;

/**
 * Своя высота на весь экран: страница стоит вне `MainLayout`, а тот держит
 * `100vh` сам. Без неё карточка прижалась бы к верхнему краю.
 */
const PAGE_STYLE = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 24,
};

const ALERT_STYLE = { marginBottom: 16 };

interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginPageProps = CardProps;

/**
 * Экран входа ядра.
 *
 * Ходит в `POST /auth/login` — договорённость ядра, см. `auth.api`. Бэкенду с
 * другим адресом панель отдаёт свою страницу через `loginElement` у
 * `PapiRouter`, и тогда этот файл просто не используется.
 *
 * После входа никуда не переходит руками: токен уходит в стор, `isAuthenticated`
 * становится истиной, и страница уводит на исходный адрес ранним возвратом
 * ниже. Тот же возврат закрывает и вторую дверь — на `/login` по прямой ссылке
 * уже вошедший не попадёт.
 */
export const LoginPage = (props: LoginPageProps) => {
  const { style, ...rest } = props;

  const location = useLocation();
  const t = useTranslation();

  const { isAuthenticated, login: startSession } = useAuth();

  const [login, { isLoading, error }] = useLoginMutation();

  const from = (location.state as PapiLoginState | null)?.from ?? PAPI_ROUTES.home;

  const apiError = error === undefined ? undefined : toApiError(error);
  const errorText =
    apiError === undefined ? undefined : (apiError.message ?? t(apiError.descriptor));

  const handleFinish = (values: LoginFormValues) => {
    /*
     * Без `unwrap`: он бросает на ошибке, и её пришлось бы ловить только затем,
     * чтобы ничего не делать — форма и так покажет её из `error` хука.
     */
    void login(values).then(({ data }) => {
      if (data === undefined) return;

      startSession(data.token);
    });
  };

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div style={PAGE_STYLE}>
      <Card style={{ width: CARD_WIDTH, ...style }} title={t(PAPI_MESSAGES.loginTitle)} {...rest}>
        {errorText !== undefined && (
          <Alert message={errorText} showIcon style={ALERT_STYLE} type="error" />
        )}

        <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            label={t(PAPI_MESSAGES.loginEmail)}
            name="email"
            rules={[
              { required: true, message: t(PAPI_MESSAGES.loginEmailRequired) },
              { type: 'email', message: t(PAPI_MESSAGES.loginEmailInvalid) },
            ]}
          >
            <Input autoComplete="email" size="large" />
          </Form.Item>

          <Form.Item
            label={t(PAPI_MESSAGES.loginPassword)}
            name="password"
            rules={[{ required: true, message: t(PAPI_MESSAGES.loginPasswordRequired) }]}
          >
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>

          <Button block htmlType="submit" loading={isLoading} size="large" type="primary">
            {t(PAPI_MESSAGES.loginSubmit)}
          </Button>
        </Form>
      </Card>
    </div>
  );
};
