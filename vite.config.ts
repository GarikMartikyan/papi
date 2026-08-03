import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ViteDevServer } from 'vite';

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
 * Бэкенда у демки нет, поэтому `/api/v1` отвечает middleware самого Vite.
 *
 * Мок нужен не для красоты: запрос уходит настоящим fetch через baseQuery ядра,
 * то есть проверяет и `configureApi`, и подстановку токена в заголовок.
 *
 * Живёт только в ветке `demo`: в `main` этого плагина нет, и панели, которые
 * форкаются от `main`, его не получают.
 */
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const INITIAL_USERS: MockUser[] = [
  { id: 'u-1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { id: 'u-2', name: 'Grace Hopper', email: 'grace@example.com', role: 'editor' },
  { id: 'u-3', name: 'Alan Turing', email: 'alan@example.com', role: 'viewer' },
];

const mockApiPlugin = (): Plugin => {
  let users = [...INITIAL_USERS];
  let nextId = users.length + 1;

  const readJsonBody = async (stream: AsyncIterable<Buffer>): Promise<unknown> => {
    const chunks: Buffer[] = [];

    for await (const chunk of stream) chunks.push(chunk);

    const raw = Buffer.concat(chunks).toString('utf8');

    return raw === '' ? {} : JSON.parse(raw);
  };

  // Принимает только `middlewares`: у dev- и preview-сервера разные типы, но
  // стек middleware у них один и тот же.
  const attach = (middlewares: ViteDevServer['middlewares']) => {
    middlewares.use((req, res, next) => {
      const url = req.url ?? '';

      if (!url.startsWith('/api/v1')) {
        next();
        return;
      }

      const path = url.slice('/api/v1'.length);

      const send = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };

      // Эхо заголовка: видно, что ядро подставило токен из localStorage.
      if (path === '/session' && req.method === 'GET') {
        send(200, {
          authorization: req.headers.authorization ?? null,
          receivedAt: new Date().toISOString(),
        });
        return;
      }

      if (path === '/users' && req.method === 'GET') {
        send(200, users);
        return;
      }

      if (path === '/users' && req.method === 'POST') {
        void readJsonBody(req)
          .then((body) => {
            const payload = body as Partial<MockUser>;
            const created: MockUser = {
              id: `u-${String(nextId++)}`,
              name: payload.name ?? 'Unnamed',
              email: payload.email ?? 'unknown@example.com',
              role: payload.role ?? 'viewer',
            };

            users = [...users, created];
            send(201, created);
          })
          .catch(() => {
            send(400, { message: 'Invalid JSON body' });
          });
        return;
      }

      const deleteMatch = /^\/users\/([\w-]+)$/.exec(path);

      if (deleteMatch !== null && req.method === 'DELETE') {
        const id = deleteMatch[1];

        users = users.filter((user) => user.id !== id);
        send(204, null);
        return;
      }

      send(404, { message: `No mock route for ${req.method ?? 'GET'} ${path}` });
    });
  };

  return {
    name: 'papi-demo:mock-api',
    configureServer: (server) => attach(server.middlewares),
    // Тот же мок под `vite preview`, иначе собранной сборке не с чем говорить.
    configurePreviewServer: (server) => attach(server.middlewares),
  };
};

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  resolve: {
    alias: { '@papi': papiCore },
  },
  server: { port: 5173 },
});
