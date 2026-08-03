import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
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

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@papi': papiCore },
  },
  server: { port: 5173 },
});
