import { combineSlices } from '@reduxjs/toolkit';

import { baseApi } from '../api/baseApi';

import { configSlice } from './slices/config.slice';

/**
 * `combineSlices`, а не `combineReducers`: панель докладывает свои слайсы в этот
 * же редьюсер через `injectSlices`.
 *
 * Стор ядра подхватывает их без `replaceReducer` — `inject` меняет карту
 * редьюсеров на месте и возвращает ту же функцию.
 */
export const rootReducer = combineSlices(configSlice, baseApi);
