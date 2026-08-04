import { createRoot } from 'react-dom/client';

import { PapiProvider } from '@papi/providers';

import { App } from './App';
import { I18N } from './i18n';

// Панель не знает ни про reset antd, ни про правки поверх темы, — это забота ядра.
import '@papi/styles.css';

/*
 * `src/api` здесь не импортируется: настраивать в нём нечего — адрес бэкенда
 * ядро берёт из окружения, а теги кеша объявляет сам файл эндпоинтов. Эти файлы
 * загрузит страница, которая их использует.
 */

const container = document.getElementById('root');

if (container === null) throw new Error('#root not found in index.html');

createRoot(container).render(
  // Тема не передаётся: панель идёт на теме ядра. Своё она добавит пропом
  // `theme` — оно ляжет поверх, целиком её описывать не нужно.
  //
  // Роутер тоже не передаётся: `BrowserRouter` ставит сам `PapiProvider`, а
  // `basename` берёт из `base` сборки.
  <PapiProvider i18n={I18N}>
    <App />
  </PapiProvider>,
);
