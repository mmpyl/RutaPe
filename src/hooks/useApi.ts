import { useCallback, useEffect, useState } from 'react';
import { Driver, Order, Route, RouteOptimizationResponse } from '../types';
import {
  createOrderRequest,
  fetchLogisticsSnapshot,
  optimizeRoutesRequest,
  sendWhatsappAlertRequest,
  updateOrderRequest,
} from '../shared/api/logistics';
import { connectLogisticsSocket } from '../shared/realtime/socket';

export const useApi = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      onError: (err) => {
        console.error('WebSocket error:', err);
      },
    });

    return () => {
      socket.close();
    };
  }, [fetchData]);

  const addOrder = async (order: Partial<Order>) => {
    try {
      const newOrder = await createOrderRequest(order);
      setError(null);
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const updatedOrder = await updateOrderRequest(id, updates);
      setError(null);
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const sendAlert = async (orderId: string) => {
    try {
      const response = await sendWhatsappAlertRequest(orderId);
      setError(null);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const optimizeRoutes = async (): Promise<RouteOptimizationResponse> => {
    try {
      setLoading(true);
      const data = await optimizeRoutesRequest();
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    drivers,
    routes,
    loading,
    error,
    fetchData,
    addOrder,
    updateOrder,
    sendAlert,
    optimizeRoutes,
  };
};
