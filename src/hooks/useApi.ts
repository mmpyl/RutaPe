import { useCallback, useEffect, useState } from 'react';
import { Driver, Order, Route, RouteOptimizationResponse } from '../types';
import {
  createOrderRequest,
  fetchLogisticsSnapshot,
  isBrowserDataMode,
  optimizeRoutesRequest,
  sendWhatsappAlertRequest,
  updateOrderRequest,
} from '../shared/api/logistics';
import { connectLogisticsSocket, WebSocketStatus } from '../shared/realtime/socket';

export const useApi = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>(isBrowserDataMode() ? 'disabled' : 'connecting');
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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();

    if (browserMode) {
      setWsStatus('disabled');
      return undefined;
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
      onStatusChange: setWsStatus,
      onError: (err) => {
        console.error('WebSocket error:', err);
      },
    });

    return () => {
      socket.close();
    };
  }, [browserMode, fetchData]);

  const addOrder = useCallback(async (order: Partial<Order>) => {
    try {
      const newOrder = await createOrderRequest(order);
      if (browserMode) {
        setOrders((currentOrders) => [newOrder, ...currentOrders]);
      }
      setError(null);
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [browserMode]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    try {
      const updatedOrder = await updateOrderRequest(id, updates);
      if (browserMode) {
        setOrders((currentOrders) => currentOrders.map((order) => (order.id === id ? updatedOrder : order)));
      }
      setError(null);
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [browserMode]);

  const sendAlert = useCallback(async (orderId: string) => {
    try {
      const response = await sendWhatsappAlertRequest(orderId);
      setError(null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, []);

  const optimizeRoutes = useCallback(async (): Promise<RouteOptimizationResponse> => {
    try {
      setLoading(true);
      const data = await optimizeRoutesRequest();
      if (browserMode) {
        const snapshot = await fetchLogisticsSnapshot();
        setOrders(snapshot.orders);
        setDrivers(snapshot.drivers);
        setRoutes(snapshot.routes);
      }
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [browserMode]);

  return {
    orders,
    drivers,
    routes,
    loading,
    error,
    wsStatus,
    browserMode,
    fetchData,
    addOrder,
    updateOrder,
    sendAlert,
    optimizeRoutes,
  };
};
