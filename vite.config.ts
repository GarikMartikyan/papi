import { fileURLToPath } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: { '@papi': papiCore },
  },
  server: { port: 5173 },
});
