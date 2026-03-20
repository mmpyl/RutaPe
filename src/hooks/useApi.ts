import { useState, useEffect, useCallback, useRef } from 'react';
import { Order, Driver, Route, OrderStatus } from '../types';

export const useApi = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, driversRes, routesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/drivers'),
        fetch('/api/routes')
      ]);

      if (!ordersRes.ok || !driversRes.ok || !routesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [ordersData, driversData, routesData] = await Promise.all([
        ordersRes.json(),
        driversRes.json(),
        routesRes.json()
      ]);

      setOrders(ordersData);
      setDrivers(driversData);
      setRoutes(routesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      switch (type) {
        case 'INIT':
          setOrders(data.orders);
          setDrivers(data.drivers);
          setRoutes(data.routes);
          break;
        case 'DRIVER_UPDATE':
          setDrivers(data);
          break;
        case 'ORDER_UPDATE':
          setOrders(data);
          break;
        case 'ROUTE_UPDATE':
          setRoutes(data);
          break;
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [fetchData]);

  const addOrder = async (order: Partial<Order>) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error('Failed to add order');
      const newOrder = await res.json();
      // WebSocket will handle state update via ORDER_UPDATE
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update order');
      const updatedOrder = await res.json();
      // WebSocket will handle state update via ORDER_UPDATE
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const sendAlert = async (orderId: string) => {
    try {
      const res = await fetch('/api/whatsapp/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (!res.ok) throw new Error('Failed to send alert');
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const optimizeRoutes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to optimize routes');
      }
      const data = await res.json();
      // WebSocket will handle state update via INIT
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
    optimizeRoutes
  };
};
