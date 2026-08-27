import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Ядро подключается одним алиасом на всю папку, а не записью на каждую точку
 * входа: новая папка в `lib/` начинает резолвиться сама, дописывать её никуда
 * не нужно.
 *
 * Сборки у ядра нет — Vite компилирует `lib/` вместе с `src/`, поэтому правка
 * ядра подхватывается тем же HMR, что и правка панели.
 */
const papiCore = fileURLToPath(new URL('./lib', import.meta.url));

/**
 * React Compiler мемоизирует компоненты и хуки на сборке — поэтому ручных
 * `useMemo` и `useCallback` в репозитории нет, и eslint их запрещает.
 *
 * Он же держит стабильными ссылки на функции, которые хук отдаёт наружу: без
 * компилятора такая функция пересоздавалась бы каждый рендер и перезапускала
 * `useEffect` у потребителя, положившего её в зависимости.
 *
 * Отдельным плагином, а не опцией `react()`: с шестой версии плагин работает
 * на oxc, babel в нём больше нет, и компилятор подключается своим проходом.
 */
export default defineConfig(({ mode }) => {
  /*
   * `import.meta.env` в конфиге ещё нет — он сам его и готовит, поэтому
   * переменные читаются явно. Только префикс `VITE_`: остальное в конфиг не
   * попадает и попасть не должно.
   */
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiProxy = env.VITE_DEV_API_PROXY;

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    resolve: {
      alias: { '@papi': papiCore },
    },
    server: {
      port: 5173,
      /*
       * Бэкенд живёт своим процессом на своём порту, а `VITE_API_BASE_URL`
       * относительный — значит запросы уходят на dev-сервер, и довести их
       * должен он. Прокси, а не абсолютный адрес в `.env`: так панель и API
       * остаются на одном origin, CORS не нужен вовсе, и переезд refresh-токена
       * в куку (см. `REFRESH_TOKEN_KEY`) не упрётся в сторонние cookie.
       *
       * Переменной, а не константой: порт бэкенда — дело окружения, и форку со
       * своим он задаётся в `.env`, а не правкой ядра. Не задана — прокси нет,
       * и запросы идут на dev-сервер как есть.
       */
      proxy:
        apiProxy === undefined || apiProxy === ''
          ? undefined
          : { '/api': { target: apiProxy, changeOrigin: true } },
    },
  };
});
