import { describe, it, expect } from 'vitest';
import {
  isOrder,
  isDriver,
  isRoute,
  isOrderStatus,
  isPodProof,
  isWhatsAppAlertResponse,
  isWsInitMessage,
  isWsDriverUpdateMessage,
  isWsOrderUpdateMessage,
  parseWsMessage,
} from '../../src/shared/contracts/guards';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validOrder = {
  id: '4021',
  status: 'Entregado',
  time: 'Hace 2 min',
  client: 'Juan Pérez',
  address: 'Av. Larco 123',
  color: 'bg-emerald-100 text-emerald-700',
  items: 3,
  value: 150.5,
};

const validDriver = {
  id: 'D1',
  name: 'Carlos Mendoza',
  status: 'En Ruta',
  orders: 5,
  efficiency: 98,
  avatar: 'CM',
  vehicle: 'Camioneta NHR',
  phone: '987654321',
};

const validRoute = {
  id: 'R1',
  driverId: 'D1',
  stops: ['4021', '4022'],
  status: 'Activa',
  progress: 50,
};

// ---------------------------------------------------------------------------
// isOrderStatus
// ---------------------------------------------------------------------------

describe('isOrderStatus', () => {
  it('acepta todos los estados válidos', () => {
    expect(isOrderStatus('Pendiente')).toBe(true);
    expect(isOrderStatus('En Ruta')).toBe(true);
    expect(isOrderStatus('Entregado')).toBe(true);
    expect(isOrderStatus('Retrasado')).toBe(true);
    expect(isOrderStatus('Cancelado')).toBe(true);
  });

  it('rechaza strings arbitrarios', () => {
    expect(isOrderStatus('Enviado')).toBe(false);
    expect(isOrderStatus('')).toBe(false);
    expect(isOrderStatus('pendiente')).toBe(false); // case-sensitive
  });

  it('rechaza no-strings', () => {
    expect(isOrderStatus(null)).toBe(false);
    expect(isOrderStatus(42)).toBe(false);
    expect(isOrderStatus(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isOrder
// ---------------------------------------------------------------------------

describe('isOrder', () => {
  it('valida un pedido completo', () => {
    expect(isOrder(validOrder)).toBe(true);
  });

  it('acepta campos opcionales ausentes', () => {
    const minimal = { ...validOrder };
    // lat/lng/carrier son opcionales en el tipo
    expect(isOrder(minimal)).toBe(true);
  });

  it('rechaza si falta un campo obligatorio', () => {
    expect(isOrder({ ...validOrder, id: undefined })).toBe(false);
    expect(isOrder({ ...validOrder, status: undefined })).toBe(false);
    expect(isOrder({ ...validOrder, client: undefined })).toBe(false);
    expect(isOrder({ ...validOrder, items: undefined })).toBe(false);
    expect(isOrder({ ...validOrder, value: undefined })).toBe(false);
  });

  it('rechaza estado inválido', () => {
    expect(isOrder({ ...validOrder, status: 'Volando' })).toBe(false);
  });

  it('rechaza items como string', () => {
    expect(isOrder({ ...validOrder, items: '3' })).toBe(false);
  });

  it('rechaza value como Infinity', () => {
    expect(isOrder({ ...validOrder, value: Infinity })).toBe(false);
  });

  it('rechaza null y primitivos', () => {
    expect(isOrder(null)).toBe(false);
    expect(isOrder('orden')).toBe(false);
    expect(isOrder([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isDriver
// ---------------------------------------------------------------------------

describe('isDriver', () => {
  it('valida un conductor completo', () => {
    expect(isDriver(validDriver)).toBe(true);
  });

  it('rechaza si falta un campo obligatorio', () => {
    expect(isDriver({ ...validDriver, id: undefined })).toBe(false);
    expect(isDriver({ ...validDriver, efficiency: undefined })).toBe(false);
    expect(isDriver({ ...validDriver, phone: undefined })).toBe(false);
  });

  it('rechaza efficiency como string', () => {
    expect(isDriver({ ...validDriver, efficiency: '98' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isRoute
// ---------------------------------------------------------------------------

describe('isRoute', () => {
  it('valida una ruta completa', () => {
    expect(isRoute(validRoute)).toBe(true);
  });

  it('acepta stops vacío', () => {
    expect(isRoute({ ...validRoute, stops: [] })).toBe(true);
  });

  it('rechaza stops con no-strings', () => {
    expect(isRoute({ ...validRoute, stops: [1, 2] })).toBe(false);
  });

  it('rechaza progress como string', () => {
    expect(isRoute({ ...validRoute, progress: '50' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPodProof
// ---------------------------------------------------------------------------

describe('isPodProof', () => {
  const validPod = {
    recipientName: 'María Torres',
    photo: 'data:image/png;base64,abc123',
    deliveredAt: '2026-03-20T14:00:00Z',
    acknowledgedByDriver: true,
  };

  it('valida una prueba de entrega mínima', () => {
    expect(isPodProof(validPod)).toBe(true);
  });

  it('acepta campos opcionales cuando están presentes y son strings', () => {
    expect(isPodProof({
      ...validPod,
      recipientDocument: '12345678',
      notes: 'Dejado en portería',
      signature: 'data:image/png;base64,sig',
    })).toBe(true);
  });

  it('rechaza si falta recipientName', () => {
    expect(isPodProof({ ...validPod, recipientName: undefined })).toBe(false);
  });

  it('rechaza recipientName vacío', () => {
    expect(isPodProof({ ...validPod, recipientName: '   ' })).toBe(false);
  });

  it('rechaza si falta photo', () => {
    expect(isPodProof({ ...validPod, photo: undefined })).toBe(false);
  });

  it('rechaza photo vacía', () => {
    expect(isPodProof({ ...validPod, photo: '' })).toBe(false);
  });

  it('rechaza si acknowledgedByDriver no es booleano', () => {
    expect(isPodProof({ ...validPod, acknowledgedByDriver: 'yes' })).toBe(false);
    expect(isPodProof({ ...validPod, acknowledgedByDriver: 1 })).toBe(false);
  });

  it('rechaza recipientDocument como número cuando está presente', () => {
    expect(isPodProof({ ...validPod, recipientDocument: 12345678 })).toBe(false);
  });

  it('rechaza null', () => {
    expect(isPodProof(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isWhatsAppAlertResponse
// ---------------------------------------------------------------------------

describe('isWhatsAppAlertResponse', () => {
  it('valida respuesta correcta', () => {
    expect(isWhatsAppAlertResponse({ success: true, message: 'Alert sent for order 4021' })).toBe(true);
    expect(isWhatsAppAlertResponse({ success: false, message: 'Rate limit exceeded' })).toBe(true);
  });

  it('rechaza si success no es booleano', () => {
    expect(isWhatsAppAlertResponse({ success: 'true', message: 'ok' })).toBe(false);
    expect(isWhatsAppAlertResponse({ success: 1, message: 'ok' })).toBe(false);
  });

  it('rechaza si message no es string', () => {
    expect(isWhatsAppAlertResponse({ success: true, message: 42 })).toBe(false);
  });

  it('rechaza null y arrays', () => {
    expect(isWhatsAppAlertResponse(null)).toBe(false);
    expect(isWhatsAppAlertResponse([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isWsInitMessage
// ---------------------------------------------------------------------------

describe('isWsInitMessage', () => {
  const validInit = {
    type: 'INIT',
    data: {
      orders: [validOrder],
      drivers: [validDriver],
      routes: [validRoute],
    },
  };

  it('valida un mensaje INIT correcto', () => {
    expect(isWsInitMessage(validInit)).toBe(true);
  });

  it('acepta arrays vacíos', () => {
    expect(isWsInitMessage({ type: 'INIT', data: { orders: [], drivers: [], routes: [] } })).toBe(true);
  });

  it('rechaza si type no es INIT', () => {
    expect(isWsInitMessage({ ...validInit, type: 'UPDATE' })).toBe(false);
  });

  it('rechaza si orders contiene un pedido malformado', () => {
    const bad = { ...validInit, data: { ...validInit.data, orders: [{ id: 123 }] } };
    expect(isWsInitMessage(bad)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isWsDriverUpdateMessage
// ---------------------------------------------------------------------------

describe('isWsDriverUpdateMessage', () => {
  it('valida mensaje DRIVER_UPDATE', () => {
    expect(isWsDriverUpdateMessage({ type: 'DRIVER_UPDATE', data: [validDriver] })).toBe(true);
  });

  it('rechaza data con driver malformado', () => {
    expect(isWsDriverUpdateMessage({ type: 'DRIVER_UPDATE', data: [{ id: 1 }] })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseWsMessage
// ---------------------------------------------------------------------------

describe('parseWsMessage', () => {
  it('parsea mensaje INIT válido', () => {
    const raw = JSON.stringify({
      type: 'INIT',
      data: { orders: [validOrder], drivers: [validDriver], routes: [validRoute] },
    });
    const result = parseWsMessage(raw);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('INIT');
  });

  it('parsea mensaje ORDER_UPDATE', () => {
    const raw = JSON.stringify({ type: 'ORDER_UPDATE', data: [validOrder] });
    const result = parseWsMessage(raw);
    expect(result?.type).toBe('ORDER_UPDATE');
  });

  it('devuelve null para JSON inválido', () => {
    expect(parseWsMessage('no-es-json{')).toBeNull();
  });

  it('devuelve null para tipo desconocido', () => {
    expect(parseWsMessage(JSON.stringify({ type: 'MYSTERY', data: [] }))).toBeNull();
  });

  it('devuelve null para mensaje bien formado pero con datos inválidos', () => {
    const raw = JSON.stringify({ type: 'ORDER_UPDATE', data: [{ id: 'ok', status: 'MALO' }] });
    expect(parseWsMessage(raw)).toBeNull();
  });
});
