import { useState, useEffect, useCallback, useRef } from 'react';
import { Driver, Order, Route } from '../types';
import {
  createOrderRequest,
  fetchLogisticsSnapshot,
  optimizeRoutesRequest,
  sendWhatsappAlertRequest,
  updateOrderRequest,
} from '../shared/api/logistics';
import { connectLogisticsSocket, LogisticsSocket } from '../shared/realtime/socket';

export interface UseApiReturn {
  orders: Order[];
  drivers: Driver[];
  routes: Route[];
  loading: boolean;
  error: string | null;
  wsStatus: 'connecting' | 'connected' | 'reconnecting';
  fetchData: () => Promise<void>;
  addOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<Order>;
  sendAlert: (orderId: string) => Promise<{ success: boolean; message: string }>;
  optimizeRoutes: () => Promise<{ message: string; routes: Route[] }>;
}

export const useApi = (): UseApiReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'reconnecting'>('connecting');

  const socketRef = useRef<LogisticsSocket | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await fetchLogisticsSnapshot();
      setOrders(snapshot.orders);
      setDrivers(snapshot.drivers);
      setRoutes(snapshot.routes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const socket = connectLogisticsSocket({
      onInit: (data) => {
        setOrders(data.orders);
        setDrivers(data.drivers);
        setRoutes(data.routes);
      },
      onDriverUpdate: setDrivers,
      onOrderUpdate: setOrders,
      onRouteUpdate: setRoutes,
      onConnected: () => {
        setWsStatus('connected');
        setError(null);
      },
      onReconnecting: (attempt) => {
        setWsStatus('reconnecting');
        setError(`Conexión perdida. Reintentando... (intento ${attempt})`);
      },
      onError: (err) => {
        console.error('[WS] Error:', err);
      },
    });

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [fetchData]);

  const addOrder = useCallback(async (order: Partial<Order>): Promise<Order> => {
    try {
      return await createOrderRequest(order);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear pedido';
      setError(message);
      throw err;
    }
  }, []);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>): Promise<Order> => {
    try {
      return await updateOrderRequest(id, updates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar pedido';
      setError(message);
      throw err;
    }
  }, []);

  const sendAlert = useCallback(async (orderId: string) => {
    try {
      return await sendWhatsappAlertRequest(orderId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar alerta';
      setError(message);
      throw err;
    }
  }, []);

  const optimizeRoutes = useCallback(async () => {
    try {
      setLoading(true);
      return await optimizeRoutesRequest();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al optimizar rutas';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    drivers,
    routes,
    loading,
    error,
    wsStatus,
    fetchData,
    addOrder,
    updateOrder,
    sendAlert,
    optimizeRoutes,
  };
};
