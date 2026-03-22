import { Order } from '../../types';

const CARRIER_COLORS: Record<string, string> = {
  Shalom: '#10b981',
  Urbano: '#f97316',
  Marvi: '#3b82f6',
  'Flota Propia': '#6366f1',
};

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const parseRelativeTimeToMinutes = (timeLabel: string) => {
  const normalized = timeLabel.trim().toLowerCase();

  if (normalized === 'ahora') return 0;

  const match = normalized.match(/hace\s+(\d+)\s*(min|hr)/);
  if (!match) return 0;

  const value = Number(match[1]);
  const unit = match[2];

  return unit === 'hr' ? value * 60 : value;
};

const startOfDay = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isoKey = (date: Date) => startOfDay(date).toISOString().slice(0, 10);

const getRecentOrderDate = (order: Order, referenceDate: Date) => {
  if (order.pod?.deliveredAt) {
    const podDate = new Date(order.pod.deliveredAt);
    if (!Number.isNaN(podDate.getTime())) {
      return podDate;
    }
  }

  const relativeMinutes = parseRelativeTimeToMinutes(order.time);
  const fallback = new Date(referenceDate);
  fallback.setMinutes(fallback.getMinutes() - relativeMinutes);
  return fallback;
};

export interface DashboardStats {
  entregados: number;
  enRuta: number;
  pendientes: number;
  incidencias: number;
}

export interface CarrierMetric {
  carrier: string;
  logo: string;
  color: string;
  totalOrders: number;
  delayedOrders: number;
  sla: number;
  deliveredRate: number;
  avgDeliveryMinutes: number;
  avgHours: number;
  avgCost: number;
}

export interface WeeklyPerformancePoint {
  name: string;
  entregas: number;
  incidencias: number;
}

export const getDashboardStats = (orders: Order[]): DashboardStats => ({
  entregados: orders.filter((order) => order.status === 'Entregado').length,
  enRuta: orders.filter((order) => order.status === 'En Ruta').length,
  pendientes: orders.filter((order) => order.status === 'Pendiente').length,
  incidencias: orders.filter((order) => order.status === 'Retrasado').length,
});

export const getDashboardDateLabel = (referenceDate = new Date()) =>
  new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(referenceDate);

export const getWeeklyPerformanceData = (
  orders: Order[],
  referenceDate = new Date(),
): WeeklyPerformancePoint[] => {
  const today = startOfDay(referenceDate);
  const series = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      name: WEEKDAY_LABELS[date.getDay()],
      key: isoKey(date),
      entregas: 0,
      incidencias: 0,
    };
  });

  const seriesByDay = new Map(series.map((entry) => [entry.key, entry]));

  orders.forEach((order) => {
    const date = getRecentOrderDate(order, referenceDate);
    const bucket = seriesByDay.get(isoKey(date));
    if (!bucket) {
      return;
    }

    if (order.status === 'Entregado') {
      bucket.entregas += 1;
    }

    if (order.status === 'Retrasado' || order.status === 'Cancelado') {
      bucket.incidencias += 1;
    }
  });

  return series.map(({ key, ...entry }) => entry);
};

export const getCarrierPerformance = (orders: Order[]): CarrierMetric[] => {
  const grouped: Record<string, Order[]> = {};

  orders.forEach((order) => {
    const carrierName = order.carrier || 'Flota Propia';
    if (!grouped[carrierName]) {
      grouped[carrierName] = [];
    }
    grouped[carrierName].push(order);
  });

  return Object.entries(grouped)
    .map(([carrier, carrierOrders]: [string, Order[]]) => {
      const completedOrders = carrierOrders.filter((order) => order.status === 'Entregado');
      const activeOrders = carrierOrders.filter((order) => order.status !== 'Pendiente');
      const delayedOrders = carrierOrders.filter((order) => order.status === 'Retrasado').length;
      const onTimeOrders = carrierOrders.filter((order) => order.status !== 'Retrasado').length;
      const timeSource = completedOrders.length ? completedOrders : activeOrders;
      const avgDeliveryMinutes = timeSource.reduce((sum, order) => sum + parseRelativeTimeToMinutes(order.time), 0) / Math.max(timeSource.length, 1);
      const avgCost = carrierOrders.reduce((sum, order) => sum + order.value, 0) / carrierOrders.length;

      return {
        carrier,
        logo: carrierOrders[0]?.carrierLogo || carrier.slice(0, 2).toUpperCase(),
        color: CARRIER_COLORS[carrier] || '#64748b',
        totalOrders: carrierOrders.length,
        delayedOrders,
        sla: Math.round((onTimeOrders / carrierOrders.length) * 100),
        deliveredRate: Math.round((completedOrders.length / carrierOrders.length) * 100),
        avgDeliveryMinutes,
        avgHours: Number((avgDeliveryMinutes / 60).toFixed(1)),
        avgCost,
      };
    })
    .sort((a, b) => b.sla - a.sla || a.avgDeliveryMinutes - b.avgDeliveryMinutes);
};
