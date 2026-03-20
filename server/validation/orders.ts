import { Order, PodProof } from '../../src/types.js';

export const ORDER_STATUSES = ['Pendiente', 'En Ruta', 'Entregado', 'Retrasado', 'Cancelado'] as const;
export const ORDER_COLORS: Record<(typeof ORDER_STATUSES)[number], string> = {
  Pendiente: 'bg-slate-100 text-slate-700',
  'En Ruta': 'bg-blue-100 text-blue-700',
  Entregado: 'bg-emerald-100 text-emerald-700',
  Retrasado: 'bg-red-100 text-red-700',
  Cancelado: 'bg-slate-200 text-slate-700',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;

const isFiniteNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value);

const hasValidCoordinates = (payload: Record<string, unknown>) => {
  const hasLat = payload.lat !== undefined;
  const hasLng = payload.lng !== undefined;

  if (!hasLat && !hasLng) return true;
  if (hasLat !== hasLng) return false;

  return isFiniteNumber(payload.lat) && isFiniteNumber(payload.lng);
};

export const validateOrderStatus = (value: unknown): value is Order['status'] =>
  typeof value === 'string' && ORDER_STATUSES.includes(value as Order['status']);

export const validatePodPayload = (value: unknown) => {
  if (!isRecord(value)) return 'La evidencia POD debe enviarse como un objeto válido';
  if (!isNonEmptyString(value.recipientName)) return 'La evidencia POD requiere el nombre del receptor';
  if (!isNonEmptyString(value.photo)) return 'La evidencia POD requiere una foto de entrega';
  if (!isNonEmptyString(value.deliveredAt)) return 'La evidencia POD requiere la fecha de entrega';
  if (value.recipientDocument !== undefined && !isNonEmptyString(value.recipientDocument)) return 'El documento del receptor debe ser un texto no vacío';
  if (value.notes !== undefined && !isNonEmptyString(value.notes)) return 'Las notas de entrega deben ser un texto no vacío';
  if (value.signature !== undefined && !isNonEmptyString(value.signature)) return 'La firma digital debe ser un texto no vacío';
  if (typeof value.acknowledgedByDriver !== 'boolean') return 'La evidencia POD debe indicar confirmación del repartidor';

  return null;
};

export const sanitizePodPayload = (value: Record<string, unknown>): PodProof => ({
  recipientName: String(value.recipientName).trim(),
  ...(value.recipientDocument !== undefined ? { recipientDocument: String(value.recipientDocument).trim() } : {}),
  ...(value.notes !== undefined ? { notes: String(value.notes).trim() } : {}),
  ...(value.signature !== undefined ? { signature: String(value.signature) } : {}),
  photo: String(value.photo),
  deliveredAt: String(value.deliveredAt),
  acknowledgedByDriver: Boolean(value.acknowledgedByDriver),
});

export const validateCreateOrderPayload = (payload: unknown) => {
  if (!isRecord(payload)) return 'El cuerpo de la solicitud debe ser un objeto JSON válido';
  if (!isNonEmptyString(payload.client)) return 'El cliente es obligatorio';
  if (!isNonEmptyString(payload.address)) return 'La dirección es obligatoria';
  if (!isFiniteNumber(payload.items) || Number(payload.items) <= 0) return 'Items debe ser un número mayor a cero';
  if (!isFiniteNumber(payload.value) || Number(payload.value) < 0) return 'El valor debe ser un número válido mayor o igual a cero';
  if (payload.status !== undefined && !validateOrderStatus(payload.status)) return 'Estado de pedido inválido';
  if (payload.time !== undefined && !isNonEmptyString(payload.time)) return 'El tiempo debe ser un texto no vacío';
  if (payload.carrier !== undefined && !isNonEmptyString(payload.carrier)) return 'El carrier debe ser un texto no vacío';
  if (payload.carrierLogo !== undefined && !isNonEmptyString(payload.carrierLogo)) return 'El logo del carrier debe ser un texto no vacío';
  if (payload.pod !== undefined) {
    const podError = validatePodPayload(payload.pod);
    if (podError) return podError;
  }
  if (!hasValidCoordinates(payload)) return 'Latitud y longitud deben enviarse juntas y ser numéricas';

  return null;
};

export const validateOrderPatchPayload = (payload: unknown) => {
  if (!isRecord(payload)) return 'El cuerpo de la solicitud debe ser un objeto JSON válido';

  const allowedKeys = new Set([
    'status',
    'time',
    'color',
    'client',
    'address',
    'items',
    'value',
    'driverId',
    'carrier',
    'carrierLogo',
    'lat',
    'lng',
    'pod',
  ]);

  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length === 0) return 'Debes enviar al menos un campo para actualizar';
  if (payloadKeys.some((key) => !allowedKeys.has(key))) return 'La solicitud contiene campos no permitidos';

  if (payload.status !== undefined && !validateOrderStatus(payload.status)) return 'Estado de pedido inválido';
  if (payload.time !== undefined && !isNonEmptyString(payload.time)) return 'El tiempo debe ser un texto no vacío';
  if (payload.client !== undefined && !isNonEmptyString(payload.client)) return 'El cliente debe ser un texto no vacío';
  if (payload.address !== undefined && !isNonEmptyString(payload.address)) return 'La dirección debe ser un texto no vacío';
  if (payload.items !== undefined && (!isFiniteNumber(payload.items) || Number(payload.items) <= 0)) return 'Items debe ser un número mayor a cero';
  if (payload.value !== undefined && (!isFiniteNumber(payload.value) || Number(payload.value) < 0)) return 'El valor debe ser un número válido mayor o igual a cero';
  if (payload.driverId !== undefined && !isNonEmptyString(payload.driverId)) return 'El conductor debe ser un texto no vacío';
  if (payload.carrier !== undefined && !isNonEmptyString(payload.carrier)) return 'El carrier debe ser un texto no vacío';
  if (payload.carrierLogo !== undefined && !isNonEmptyString(payload.carrierLogo)) return 'El logo del carrier debe ser un texto no vacío';
  if (payload.pod !== undefined) {
    const podError = validatePodPayload(payload.pod);
    if (podError) return podError;
  }
  if (!hasValidCoordinates(payload)) return 'Latitud y longitud deben enviarse juntas y ser numéricas';

  return null;
};

export const buildOrderPayload = (payload: Record<string, unknown>, existingOrder?: Order): Order | Partial<Order> => {
  const status = validateOrderStatus(payload.status)
    ? payload.status
    : existingOrder?.status ?? 'Pendiente';

  return {
    ...(existingOrder ?? {}),
    ...(payload.client !== undefined ? { client: String(payload.client).trim() } : {}),
    ...(payload.address !== undefined ? { address: String(payload.address).trim() } : {}),
    ...(payload.items !== undefined ? { items: payload.items as number } : {}),
    ...(payload.value !== undefined ? { value: payload.value as number } : {}),
    ...(payload.driverId !== undefined ? { driverId: String(payload.driverId).trim() } : {}),
    ...(payload.carrier !== undefined ? { carrier: String(payload.carrier).trim() } : {}),
    ...(payload.carrierLogo !== undefined ? { carrierLogo: String(payload.carrierLogo).trim() } : {}),
    ...(payload.lat !== undefined ? { lat: payload.lat as number } : {}),
    ...(payload.lng !== undefined ? { lng: payload.lng as number } : {}),
    ...(payload.pod !== undefined && isRecord(payload.pod) ? { pod: sanitizePodPayload(payload.pod) } : {}),
    status,
    time: payload.time !== undefined ? String(payload.time).trim() : existingOrder?.time ?? 'Ahora',
    color: payload.color !== undefined ? String(payload.color) : ORDER_COLORS[status],
  };
};
