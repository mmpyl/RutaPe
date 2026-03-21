import { useCallback, useEffect, useState } from 'react';
import { Driver, Order, Route, RouteOptimizationResponse } from '../types';
import { isBrowserDataMode } from '../shared/config/dataMode';
import {
  createOrderRequest,
  fetchLogisticsSnapshot,
  optimizeRoutesRequest,
  sendWhatsappAlertRequest,
  updateOrderRequest,
} from '../shared/api/logistics';
import { connectLogisticsSocket } from '../shared/realtime/socket';

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
  const browserMode = isBrowserDataMode();

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

    if (browserMode) {
      return;
    }

    const socket = connectLogisticsSocket({
      onInit: (data) => {
        setOrders(data.orders);
        setDrivers(data.drivers);
        setRoutes(data.routes);
      },
      onDriverUpdate: setDrivers,
      onOrderUpdate: setOrders,
      onRouteUpdate: setRoutes,
      onError: (err) => {
        console.error('WebSocket error:', err);
      },
    });

    return () => {
      socket.close();
    };
  }, [browserMode, fetchData]);

  const addOrder = useCallback(async (order: Partial<Order>): Promise<Order> => {
    try {
      const newOrder = await createOrderRequest(order);
      if (browserMode) {
        await fetchData();
      }
      setError(null);
      return newOrder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear pedido';
      setError(message);
      throw err;
    }
  }, []);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>): Promise<Order> => {
    try {
      const updatedOrder = await updateOrderRequest(id, updates);
      if (browserMode) {
        await fetchData();
      }
      setError(null);
      return updatedOrder;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar pedido';
      setError(message);
      throw err;
    }
  }, []);

  const sendAlert = useCallback(async (orderId: string) => {
    try {
      const response = await sendWhatsappAlertRequest(orderId);
      setError(null);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar alerta';
      setError(message);
      throw err;
    }
  }, []);

  const optimizeRoutes = async (): Promise<RouteOptimizationResponse> => {
    try {
      setLoading(true);
      const data = await optimizeRoutesRequest();
      if (browserMode) {
        await fetchData();
      }
      setError(null);
      return data;
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
    browserMode,
  };
};
