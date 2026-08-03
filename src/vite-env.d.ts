/// <reference types="vite/client" />

/**
 * Переменные окружения панели.
 *
 * Объявляются здесь, потому что `vite/client` описывает `import.meta.env`
 * индексной сигнатурой `any`: без этого файла любое чтение переменной было бы
 * небезопасным по типам, и type-aware правила eslint на нём ругались бы.
 *
 * Каждая новая `VITE_*` дописывается сюда — иначе она снова станет `any`.
 * Значения по умолчанию лежат в `.env.example`.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
