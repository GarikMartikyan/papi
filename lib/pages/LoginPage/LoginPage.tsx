import { Alert, Button, Form, Input } from 'antd';
import { Navigate, useLocation } from 'react-router';

import { useLoginMutation } from '../../api/endpoints/auth.api';
import { AuthLayout, type AuthLayoutProps } from '../../components/layouts/AuthLayout/AuthLayout';
import { papiRoutes } from '../../constants/routes.constants';
import { useAuth } from '../../hooks/useAuth';
import { usePapiTranslation } from '../../hooks/usePapiTranslation';
import type { PapiLoginState } from '../../types/interfaces/loginState.interface';
import { toApiError } from '../../utils/apiError.util';

const ALERT_STYLE = { marginBottom: 16 };

interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Пропсы каркаса, кроме содержимого карточки: им у этой страницы всегда форма
 * входа, и переданное снаружи молча пропало бы.
 */
export type LoginPageProps = Omit<AuthLayoutProps, 'children'>;

/**
 * Экран входа ядра.
 *
 * Ходит в `POST /auth/login` — договорённость ядра, см. `auth.api`. Бэкенду с
 * другим адресом панель отдаёт свою страницу через `loginElement` у
 * `PapiRouter`, и тогда этот файл просто не используется.
 *
 * Обрамление — кадры, логотип, стеклянная карточка — целиком в `AuthLayout`,
 * общем для входных страниц. Здесь остаётся сама форма и то, что за ней стоит.
 *
 * После входа никуда не переходит руками: токен уходит в стор, `isAuthenticated`
 * становится истиной, и страница уводит на исходный адрес ранним возвратом
 * ниже. Тот же возврат закрывает и вторую дверь — на `/login` по прямой ссылке
 * уже вошедший не попадёт.
 */
export const LoginPage = (props: LoginPageProps) => {
  const location = useLocation();
  const t = usePapiTranslation();

  const { isAuthenticated, login: startSession } = useAuth();

  const [login, { isLoading, error }] = useLoginMutation();

  const from = (location.state as PapiLoginState | null)?.from ?? papiRoutes.home;

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
    <AuthLayout title={t('sign in (page title)')} {...props}>
      {errorText !== undefined && (
        <Alert showIcon style={ALERT_STYLE} title={errorText} type="error" />
      )}

      <Form<LoginFormValues> layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item
          label={t('email')}
          name="email"
          rules={[
            { required: true, message: t('enter your email') },
            { type: 'email', message: t('this does not look like an email') },
          ]}
        >
          <Input autoComplete="email" size="large" />
        </Form.Item>

        <Form.Item
          label={t('password')}
          name="password"
          rules={[{ required: true, message: t('enter your password') }]}
        >
          <Input.Password autoComplete="current-password" size="large" />
        </Form.Item>

        <Button block htmlType="submit" loading={isLoading} size="large" type="primary">
          {t('sign in')}
        </Button>
      </Form>
    </AuthLayout>
  );
};
