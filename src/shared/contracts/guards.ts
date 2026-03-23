import { Driver, Order, Route, RouteOptimizationResponse } from '../../types';
import type { LogisticsSnapshot } from '../api/logistics';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

export const isOrder = (value: unknown): value is Order => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.status)
    && isString(value.time)
    && isString(value.client)
    && isString(value.address)
    && isString(value.color)
    && isNumber(value.items)
    && isNumber(value.value);
};

export const isDriver = (value: unknown): value is Driver => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.name)
    && isString(value.status)
    && isNumber(value.orders)
    && isNumber(value.efficiency)
    && isString(value.avatar)
    && isString(value.vehicle)
    && isString(value.phone);
};

export const isRoute = (value: unknown): value is Route => {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.driverId)
    && Array.isArray(value.stops)
    && value.stops.every(isString)
    && isString(value.status)
    && isNumber(value.progress);
};

export const isOrderArray = (value: unknown): value is Order[] => Array.isArray(value) && value.every(isOrder);
export const isDriverArray = (value: unknown): value is Driver[] => Array.isArray(value) && value.every(isDriver);
export const isRouteArray = (value: unknown): value is Route[] => Array.isArray(value) && value.every(isRoute);

export const isLogisticsSnapshot = (value: unknown): value is LogisticsSnapshot => {
  if (!isRecord(value)) return false;
  return isOrderArray(value.orders) && isDriverArray(value.drivers) && isRouteArray(value.routes);
};

export const isRouteOptimizationResponse = (value: unknown): value is RouteOptimizationResponse => {
  if (!isRecord(value)) return false;
  return isString(value.message) && isRouteArray(value.routes);
};

export const isSuccessMessage = (value: unknown): value is { success: boolean; message: string } => {
  if (!isRecord(value)) return false;
  return isBoolean(value.success) && isString(value.message);
};
