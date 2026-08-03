import { createRoot } from 'react-dom/client';

import { BrowserRouter } from 'react-router';

import { PapiProvider } from '@papi/providers';

import { App } from './App';
import { I18N } from './i18n';

// Панель не знает ни про reset antd, ни про правки поверх темы, — это забота ядра.
import '@papi/styles.css';

/*
 * Импорт ради сайд-эффекта: модуль вызывает `configureApi`, и без него ядро не
 * узнает адрес бэкенда. Здесь, а не в странице, потому что страниц с запросами
 * у скелета пока нет.
 */
import './api';

const container = document.getElementById('root');

if (container === null) throw new Error('#root not found in index.html');

createRoot(container).render(
  // Тема не передаётся: панель идёт на теме ядра. Своё она добавит пропом
  // `theme` — оно ляжет поверх, целиком её описывать не нужно.
  <PapiProvider i18n={I18N}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </PapiProvider>,
);
