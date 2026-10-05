import { ROUTES } from '../base/constants.js';
import { prepareInicio } from '../pages/inicio.js';
import { prepareNaoEncontrado } from '../pages/nao-encontrado.js';
export const routes = new Map([[ROUTES.HOME, prepareInicio]]);
export const fallbackRoute = prepareNaoEncontrado;
