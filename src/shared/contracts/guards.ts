/**
 * src/shared/contracts/guards.ts
 *
 * Validación en runtime de los contratos de comunicación entre frontend y backend.
 * Reemplaza el JSON.parse "a ciegas" en socket.ts y los casts sin verificar en logistics.ts.
 *
 * No se usa zod para evitar añadir dependencias al MVP; los guards son funciones
 * de tipo predicado que TypeScript entiende directamente.
 */

import { Order, Driver, Route, OrderStatus, PodProof } from '../../types';

// ---------------------------------------------------------------------------
// Primitivos
// ---------------------------------------------------------------------------

const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean';
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

// ---------------------------------------------------------------------------
// Dominio
// ---------------------------------------------------------------------------

const ORDER_STATUSES: OrderStatus[] = [
  'Pendiente',
  'En Ruta',
  'Entregado',
  'Retrasado',
  'Cancelado',
];

export const isOrderStatus = (v: unknown): v is OrderStatus =>
  isString(v) && ORDER_STATUSES.includes(v as OrderStatus);

export const isOrder = (v: unknown): v is Order => {
  if (!isObject(v)) return false;
  return (
    isString(v.id) &&
    isOrderStatus(v.status) &&
    isString(v.time) &&
    isString(v.client) &&
    isString(v.address) &&
    isString(v.color) &&
    isNumber(v.items) &&
    isNumber(v.value)
  );
};

export const isDriver = (v: unknown): v is Driver => {
  if (!isObject(v)) return false;
  return (
    isString(v.id) &&
    isString(v.name) &&
    isString(v.status) &&
    isNumber(v.orders) &&
    isNumber(v.efficiency) &&
    isString(v.avatar) &&
    isString(v.vehicle) &&
    isString(v.phone)
  );
};

export const isRoute = (v: unknown): v is Route => {
  if (!isObject(v)) return false;
  return (
    isString(v.id) &&
    isString(v.driverId) &&
    isArray(v.stops) &&
    v.stops.every(isString) &&
    isString(v.status) &&
    isNumber(v.progress)
  );
};

export const isPodProof = (v: unknown): v is PodProof => {
  if (!isObject(v)) return false;
  // Campos obligatorios
  if (!isString(v.recipientName) || v.recipientName.trim().length === 0) return false;
  if (!isString(v.photo) || v.photo.length === 0) return false;
  if (!isString(v.deliveredAt) || v.deliveredAt.length === 0) return false;
  if (!isBoolean(v.acknowledgedByDriver)) return false;
  // Campos opcionales — si presentes deben ser strings no vacíos
  if (v.recipientDocument !== undefined && !isString(v.recipientDocument)) return false;
  if (v.notes !== undefined && !isString(v.notes)) return false;
  if (v.signature !== undefined && !isString(v.signature)) return false;
  return true;
};

// ---------------------------------------------------------------------------
// Mensajes WebSocket
// ---------------------------------------------------------------------------

export interface WsInitPayload {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
}

export interface WsInitMessage {
  type: 'INIT';
  data: WsInitPayload;
}

export interface WsDriverUpdateMessage {
  type: 'DRIVER_UPDATE';
  data: Driver[];
}

export interface WsOrderUpdateMessage {
  type: 'ORDER_UPDATE';
  data: Order[];
}

export interface WsRouteUpdateMessage {
  type: 'ROUTE_UPDATE';
  data: Route[];
}

export type WsMessage =
  | WsInitMessage
  | WsDriverUpdateMessage
  | WsOrderUpdateMessage
  | WsRouteUpdateMessage;

export const isWsInitMessage = (v: unknown): v is WsInitMessage => {
  if (!isObject(v) || v.type !== 'INIT') return false;
  if (!isObject(v.data)) return false;
  const d = v.data as Record<string, unknown>;
  return (
    isArray(d.orders) &&
    d.orders.every(isOrder) &&
    isArray(d.drivers) &&
    d.drivers.every(isDriver) &&
    isArray(d.routes) &&
    d.routes.every(isRoute)
  );
};

export const isWsDriverUpdateMessage = (v: unknown): v is WsDriverUpdateMessage =>
  isObject(v) && v.type === 'DRIVER_UPDATE' && isArray(v.data) && v.data.every(isDriver);

export const isWsOrderUpdateMessage = (v: unknown): v is WsOrderUpdateMessage =>
  isObject(v) && v.type === 'ORDER_UPDATE' && isArray(v.data) && v.data.every(isOrder);

export const isWsRouteUpdateMessage = (v: unknown): v is WsRouteUpdateMessage =>
  isObject(v) && v.type === 'ROUTE_UPDATE' && isArray(v.data) && v.data.every(isRoute);

/**
 * Parsea y valida un mensaje WS crudo.
 * Devuelve el mensaje tipado o null si no es válido.
 */
export const parseWsMessage = (raw: string): WsMessage | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[WS] Mensaje no es JSON válido:', raw.slice(0, 100));
    return null;
  }

  if (isWsInitMessage(parsed)) return parsed;
  if (isWsDriverUpdateMessage(parsed)) return parsed;
  if (isWsOrderUpdateMessage(parsed)) return parsed;
  if (isWsRouteUpdateMessage(parsed)) return parsed;

  if (isObject(parsed)) {
    console.warn('[WS] Tipo de mensaje desconocido o malformado:', parsed.type);
  }
  return null;
};

// ---------------------------------------------------------------------------
// Respuestas de API
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  error: string;
}

export const isApiErrorBody = (v: unknown): v is ApiErrorBody =>
  isObject(v) && isString(v.error);

export const isOrderArray = (v: unknown): v is Order[] =>
  isArray(v) && v.every(isOrder);

export const isDriverArray = (v: unknown): v is Driver[] =>
  isArray(v) && v.every(isDriver);

export const isRouteArray = (v: unknown): v is Route[] =>
  isArray(v) && v.every(isRoute);

export interface WhatsAppAlertResponse {
  success: boolean;
  message: string;
}

export const isWhatsAppAlertResponse = (v: unknown): v is WhatsAppAlertResponse =>
  isObject(v) && isBoolean(v.success) && isString(v.message);
