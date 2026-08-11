import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { MessageDescriptor } from 'react-intl';

import { papiMessage } from '../i18n/messages';

import { readApiMessage } from './apiMessage.util';

/**
 * Ответ «сессии больше нет». Единственный статус, на который ядро не только
 * показывает текст, но и действует, — поэтому он и выходит наружу.
 */
export const UNAUTHORIZED_STATUS = 401;

/** Остальные статусы, на которые у ядра есть свой текст. */
const FORBIDDEN = 403;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;

/**
 * Разобранная ошибка запроса — всё, что нужно, чтобы её показать.
 *
 * Текст и ключ разведены намеренно. `message` приходит от бэкенда и уже на
 * нужном языке — переводить его нечем и незачем. `descriptor` — запасной текст
 * ядра, он переводится и показывается, когда бэкенд ничего не прислал.
 */
export interface PapiApiError {
  /** HTTP-статус. Его нет у сетевых сбоев: ответа не было вовсе. */
  status?: number;
  /** Текст от бэкенда. Показывается как есть, если он пришёл. */
  message?: string;
  /** Строка ядра на случай, если своего текста у ответа не оказалось. */
  descriptor: MessageDescriptor;
}

/** Строка ядра под статус ответа. */
const resolveDescriptor = (status: number): MessageDescriptor => {
  if (status === UNAUTHORIZED_STATUS) {
    return papiMessage('the session has ended — please sign in again');
  }

  if (status === FORBIDDEN) return papiMessage('you have no access to this');
  if (status === NOT_FOUND) return papiMessage('nothing found at this address');
  if (status >= SERVER_ERROR) return papiMessage('the server failed to handle the request');

  return papiMessage('something went wrong');
};

/**
 * Ошибка запроса → то, что можно показать пользователю.
 *
 * У `fetchBaseQuery` два вида ошибок: с числовым статусом — это ответ сервера,
 * и со строковым — это сбой до ответа. Их и различаем, потому что показывать
 * их нужно по-разному: у первого может быть текст от бэкенда, у второго тела
 * нет вовсе.
 *
 * Принимает и `SerializedError` — так RTK Query отдаёт исключение, вылетевшее
 * не из запроса, а из кода вокруг него (`transformResponse`, например). Его
 * `message` пользователю не показываем: это текст для разработчика, вплоть до
 * стека.
 */
export const toApiError = (error: FetchBaseQueryError | SerializedError): PapiApiError => {
  if (!('status' in error)) return { descriptor: papiMessage('something went wrong') };

  if (typeof error.status === 'number') {
    return {
      status: error.status,
      message: readApiMessage(error.data),
      descriptor: resolveDescriptor(error.status),
    };
  }

  if (error.status === 'TIMEOUT_ERROR') {
    return { descriptor: papiMessage('the server took too long to answer') };
  }

  if (error.status === 'PARSING_ERROR') {
    return { descriptor: papiMessage('the server sent an answer we could not read') };
  }

  if (error.status === 'FETCH_ERROR') {
    return { descriptor: papiMessage('no connection to the server') };
  }

  /*
   * Остаётся `CUSTOM_ERROR` — его никто не бросает, пока панель не напишет свой
   * baseQuery. Текст в нём произвольный и не для пользователя, поэтому в
   * `message` он не идёт.
   */
  return { descriptor: papiMessage('something went wrong') };
};
