import { createRoot } from 'react-dom/client';

import { PapiProvider } from '@papi/providers';

import { App } from './App';
import { I18N } from './i18n/i18n';

import '@papi/styles.css';

const container = document.getElementById('root');

if (container === null) throw new Error('#root not found in index.html');

createRoot(container).render(
  <PapiProvider i18n={I18N}>
    <App />
  </PapiProvider>,
);
