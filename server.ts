import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Order, Driver, Route } from "./src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORDER_STATUSES = ['Pendiente', 'En Ruta', 'Entregado', 'Retrasado', 'Cancelado'] as const;
const ORDER_COLORS: Record<(typeof ORDER_STATUSES)[number], string> = {
  'Pendiente': 'bg-slate-100 text-slate-700',
  'En Ruta': 'bg-blue-100 text-blue-700',
  'Entregado': 'bg-emerald-100 text-emerald-700',
  'Retrasado': 'bg-red-100 text-red-700',
  'Cancelado': 'bg-slate-200 text-slate-700',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0;

const isFiniteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const hasValidCoordinates = (payload: Record<string, unknown>) => {
  const hasLat = payload.lat !== undefined;
  const hasLng = payload.lng !== undefined;

  if (!hasLat && !hasLng) return true;
  if (hasLat !== hasLng) return false;

  return isFiniteNumber(payload.lat) && isFiniteNumber(payload.lng);
};

const validateOrderStatus = (value: unknown): value is Order["status"] =>
  typeof value === "string" && ORDER_STATUSES.includes(value as Order["status"]);

const validatePodPayload = (value: unknown) => {
  if (!isRecord(value)) return "La evidencia POD debe enviarse como un objeto válido";
  if (!isNonEmptyString(value.recipientName)) return "La evidencia POD requiere el nombre del receptor";
  if (!isNonEmptyString(value.photo)) return "La evidencia POD requiere una foto de entrega";
  if (!isNonEmptyString(value.deliveredAt)) return "La evidencia POD requiere la fecha de entrega";
  if (value.recipientDocument !== undefined && !isNonEmptyString(value.recipientDocument)) return "El documento del receptor debe ser un texto no vacío";
  if (value.notes !== undefined && !isNonEmptyString(value.notes)) return "Las notas de entrega deben ser un texto no vacío";
  if (value.signature !== undefined && !isNonEmptyString(value.signature)) return "La firma digital debe ser un texto no vacío";
  if (typeof value.acknowledgedByDriver !== "boolean") return "La evidencia POD debe indicar confirmación del repartidor";

  return null;
};

const sanitizePodPayload = (value: Record<string, unknown>) => ({
  recipientName: String(value.recipientName).trim(),
  ...(value.recipientDocument !== undefined ? { recipientDocument: String(value.recipientDocument).trim() } : {}),
  ...(value.notes !== undefined ? { notes: String(value.notes).trim() } : {}),
  ...(value.signature !== undefined ? { signature: String(value.signature) } : {}),
  photo: String(value.photo),
  deliveredAt: String(value.deliveredAt),
  acknowledgedByDriver: Boolean(value.acknowledgedByDriver),
});


const validateCreateOrderPayload = (payload: unknown) => {
  if (!isRecord(payload)) return "El cuerpo de la solicitud debe ser un objeto JSON válido";
  if (!isNonEmptyString(payload.client)) return "El cliente es obligatorio";
  if (!isNonEmptyString(payload.address)) return "La dirección es obligatoria";
  if (!isFiniteNumber(payload.items) || Number(payload.items) <= 0) return "Items debe ser un número mayor a cero";
  if (!isFiniteNumber(payload.value) || Number(payload.value) < 0) return "El valor debe ser un número válido mayor o igual a cero";
  if (payload.status !== undefined && !validateOrderStatus(payload.status)) return "Estado de pedido inválido";
  if (payload.time !== undefined && !isNonEmptyString(payload.time)) return "El tiempo debe ser un texto no vacío";
  if (payload.carrier !== undefined && !isNonEmptyString(payload.carrier)) return "El carrier debe ser un texto no vacío";
  if (payload.carrierLogo !== undefined && !isNonEmptyString(payload.carrierLogo)) return "El logo del carrier debe ser un texto no vacío";
  if (payload.pod !== undefined) {
    const podError = validatePodPayload(payload.pod);
    if (podError) return podError;
  }
  if (!hasValidCoordinates(payload)) return "Latitud y longitud deben enviarse juntas y ser numéricas";

  return null;
};

const validateOrderPatchPayload = (payload: unknown) => {
  if (!isRecord(payload)) return "El cuerpo de la solicitud debe ser un objeto JSON válido";

  const allowedKeys = new Set([
    "status",
    "time",
    "color",
    "client",
    "address",
    "items",
    "value",
    "driverId",
    "carrier",
    "carrierLogo",
    "lat",
    "lng",
    "pod",
  ]);

  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length === 0) return "Debes enviar al menos un campo para actualizar";
  if (payloadKeys.some((key) => !allowedKeys.has(key))) return "La solicitud contiene campos no permitidos";

  if (payload.status !== undefined && !validateOrderStatus(payload.status)) return "Estado de pedido inválido";
  if (payload.time !== undefined && !isNonEmptyString(payload.time)) return "El tiempo debe ser un texto no vacío";
  if (payload.client !== undefined && !isNonEmptyString(payload.client)) return "El cliente debe ser un texto no vacío";
  if (payload.address !== undefined && !isNonEmptyString(payload.address)) return "La dirección debe ser un texto no vacío";
  if (payload.items !== undefined && (!isFiniteNumber(payload.items) || Number(payload.items) <= 0)) return "Items debe ser un número mayor a cero";
  if (payload.value !== undefined && (!isFiniteNumber(payload.value) || Number(payload.value) < 0)) return "El valor debe ser un número válido mayor o igual a cero";
  if (payload.driverId !== undefined && !isNonEmptyString(payload.driverId)) return "El conductor debe ser un texto no vacío";
  if (payload.carrier !== undefined && !isNonEmptyString(payload.carrier)) return "El carrier debe ser un texto no vacío";
  if (payload.carrierLogo !== undefined && !isNonEmptyString(payload.carrierLogo)) return "El logo del carrier debe ser un texto no vacío";
  if (payload.pod !== undefined) {
    const podError = validatePodPayload(payload.pod);
    if (podError) return podError;
  }
  if (!hasValidCoordinates(payload)) return "Latitud y longitud deben enviarse juntas y ser numéricas";

  return null;
};

const buildOrderPayload = (payload: Record<string, unknown>, existingOrder?: Order): Order | Partial<Order> => {
  const status = validateOrderStatus(payload.status)
    ? payload.status
    : existingOrder?.status ?? "Pendiente";

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
    time: payload.time !== undefined ? String(payload.time).trim() : existingOrder?.time ?? "Ahora",
    color: payload.color !== undefined ? String(payload.color) : ORDER_COLORS[status],
  };
};

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // --- Mock Data ---
  let orders: Order[] = [
    { id: '4021', status: 'Entregado', time: 'Hace 2 min', client: 'Juan Pérez', address: 'Av. Larco 123, Miraflores', color: 'bg-emerald-100 text-emerald-700', items: 3, value: 150.50, driverId: 'D1', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1221, lng: -77.0298 },
    { id: '4022', status: 'En Ruta', time: 'Hace 15 min', client: 'María García', address: 'Calle Las Flores 456, San Isidro', color: 'bg-blue-100 text-blue-700', items: 1, value: 45.00, driverId: 'D1', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.0945, lng: -77.0356 },
    { id: '4023', status: 'Retrasado', time: 'Hace 1 hr', client: 'Carlos Torres', address: 'Jr. Puno 789, Cercado', color: 'bg-red-100 text-red-700', items: 5, value: 320.00, driverId: 'D3', carrier: 'Urbano', carrierLogo: 'UR', lat: -12.0464, lng: -77.0297 },
    { id: '4024', status: 'Pendiente', time: 'Hace 2 hr', client: 'Ana Loli', address: 'Av. Universitaria 101, SMP', color: 'bg-slate-100 text-slate-700', items: 2, value: 89.90, lat: -11.9912, lng: -77.0823 },
    { id: '4025', status: 'Pendiente', time: 'Hace 3 hr', client: 'Roberto Díaz', address: 'Av. Javier Prado 1500, San Borja', color: 'bg-slate-100 text-slate-700', items: 4, value: 210.00, lat: -12.0854, lng: -77.0012 },
    { id: '4026', status: 'En Ruta', time: 'Hace 30 min', client: 'Elena Paz', address: 'Av. Arequipa 2400, Lince', color: 'bg-blue-100 text-blue-700', items: 2, value: 120.00, driverId: 'D2', carrier: 'Marvi', carrierLogo: 'MV', lat: -12.0823, lng: -77.0345 },
  ];

  let drivers: Driver[] = [
    { id: 'D1', name: "Carlos Mendoza", status: "En Ruta", orders: 5, efficiency: 98, avatar: "CM", vehicle: "Camioneta NHR", phone: "987654321", carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1000, lng: -77.0300 },
    { id: 'D2', name: "Luis Paredes", status: "En Ruta", orders: 3, efficiency: 95, avatar: "LP", vehicle: "Moto Cargo", phone: "912345678", carrier: 'Marvi', carrierLogo: 'MV', lat: -12.0800, lng: -77.0350 },
    { id: 'D3', name: "Jorge Ruiz", status: "En Ruta", orders: 3, efficiency: 92, avatar: "JR", vehicle: "Furgón H100", phone: "955443322", carrier: 'Urbano', carrierLogo: 'UR', lat: -12.0500, lng: -77.0300 },
    { id: 'D4', name: "Ana Belén", status: "Disponible", orders: 0, efficiency: 99, avatar: "AB", vehicle: "Camioneta NHR", phone: "944332211", carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1200, lng: -77.0200 },
  ];

  let routes: Route[] = [
    { id: 'R1', driverId: 'D1', stops: ['4021', '4022'], status: 'Activa', progress: 50 },
    { id: 'R2', driverId: 'D2', stops: ['4026'], status: 'Activa', progress: 30 },
    { id: 'R3', driverId: 'D3', stops: ['4023'], status: 'Activa', progress: 10 },
  ];

  // --- WebSocket Server ---
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");
    ws.send(JSON.stringify({ type: "INIT", data: { orders, drivers, routes } }));
  });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // --- Driver Simulation ---
  setInterval(() => {
    drivers = drivers.map(driver => {
      if (driver.status === "En Ruta") {
        // Small random movement
        const newLat = driver.lat! + (Math.random() - 0.5) * 0.001;
        const newLng = driver.lng! + (Math.random() - 0.5) * 0.001;
        return { ...driver, lat: newLat, lng: newLng };
      }
      return driver;
    });
    broadcast({ type: "DRIVER_UPDATE", data: drivers });
  }, 3000);

  // --- API Routes ---

  app.get("/api/orders", (req, res) => {
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const validationError = validateCreateOrderPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const payload = req.body as Record<string, unknown>;
    const newOrder: Order = {
      ...(buildOrderPayload(payload) as Order),
      id: (Math.floor(Math.random() * 1000) + 4100).toString(),
      carrier: payload.carrier ? String(payload.carrier).trim() : 'Flota Propia',
      carrierLogo: payload.carrierLogo ? String(payload.carrierLogo).trim() : 'FP',
    };

    orders = [newOrder, ...orders];
    broadcast({ type: "ORDER_UPDATE", data: orders });
    return res.status(201).json(newOrder);
  });

  app.patch("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const existingOrder = orders.find((order) => order.id === id);

    if (!existingOrder) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const validationError = validateOrderPatchPayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatedOrder = buildOrderPayload(req.body as Record<string, unknown>, existingOrder) as Order;
    orders = orders.map((order) => order.id === id ? updatedOrder : order);

    broadcast({ type: "ORDER_UPDATE", data: orders });
    return res.json(updatedOrder);
  });

  app.get("/api/drivers", (req, res) => {
    res.json(drivers);
  });

  app.get("/api/routes", (req, res) => {
    res.json(routes);
  });

  app.post("/api/routes/optimize", (req, res) => {
    const pendingOrders = orders.filter(o => o.status === 'Pendiente');
    if (pendingOrders.length === 0) {
      return res.json({ message: "No hay pedidos pendientes para optimizar", routes });
    }

    const availableDrivers = drivers.filter(d => d.status === 'Disponible' || d.status === 'En Ruta');
    if (availableDrivers.length === 0) {
      return res.status(400).json({ error: "No hay conductores disponibles" });
    }

    const DEPOT = { lat: -12.1221, lng: -77.0298 };
    const getDist = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    };

    // 1. Balanced Assignment: Assign orders to drivers considering distance and current load
    pendingOrders.forEach(order => {
      let bestDriver = null;
      let minCost = Infinity;

      availableDrivers.forEach(driver => {
        const route = routes.find(r => r.driverId === driver.id && r.status === 'Activa');
        let lastLat = driver.lat!;
        let lastLng = driver.lng!;

        if (route && route.stops.length > 0) {
          const lastStopId = route.stops[route.stops.length - 1];
          const lastStop = orders.find(o => o.id === lastStopId);
          if (lastStop && lastStop.lat && lastStop.lng) {
            lastLat = lastStop.lat;
            lastLng = lastStop.lng;
          }
        }

        const dist = getDist(lastLat, lastLng, order.lat!, order.lng!);
        const currentLoad = route ? route.stops.length : 0;
        // Cost function: distance + penalty for existing load to balance work
        const cost = dist + (currentLoad * 0.005); 

        if (cost < minCost) {
          minCost = cost;
          bestDriver = driver;
        }
      });

      if (bestDriver) {
        order.driverId = (bestDriver as Driver).id;
        order.status = 'En Ruta';
        order.color = 'bg-blue-100 text-blue-700';

        let route = routes.find(r => r.driverId === (bestDriver as Driver).id && r.status === 'Activa');
        if (!route) {
          route = {
            id: `R${Math.floor(Math.random() * 1000)}`,
            driverId: (bestDriver as Driver).id,
            stops: [],
            status: 'Activa',
            progress: 0
          };
          routes.push(route);
        }
        route.stops.push(order.id);
        (bestDriver as Driver).status = 'En Ruta';
      }
    });

    // 2. TSP Optimization with 2-Opt Refinement
    routes.forEach(route => {
      if (route.status !== 'Activa') return;
      const driver = drivers.find(d => d.id === route.driverId);
      if (!driver) return;

      const activeStops = route.stops.filter(id => {
        const o = orders.find(ord => ord.id === id);
        return o?.status !== 'Entregado';
      });

      if (activeStops.length < 2) return;

      // Initial sequence using Nearest Neighbor
      let optimizedStops: string[] = [];
      let remaining = [...activeStops];
      let currLat = driver.lat!;
      let currLng = driver.lng!;

      while (remaining.length > 0) {
        let nearestIdx = 0;
        let minDist = Infinity;
        remaining.forEach((id, idx) => {
          const o = orders.find(ord => ord.id === id)!;
          const d = getDist(currLat, currLng, o.lat!, o.lng!);
          if (d < minDist) {
            minDist = d;
            nearestIdx = idx;
          }
        });
        const nextId = remaining.splice(nearestIdx, 1)[0];
        optimizedStops.push(nextId);
        const nextOrder = orders.find(o => o.id === nextId)!;
        currLat = nextOrder.lat!;
        currLng = nextOrder.lng!;
      }

      // 2-Opt Refinement: Try to swap segments to reduce total distance
      const calculateRouteDist = (stopIds: string[]) => {
        let d = 0;
        let pLat = driver.lat!;
        let pLng = driver.lng!;
        stopIds.forEach(id => {
          const o = orders.find(ord => ord.id === id)!;
          d += getDist(pLat, pLng, o.lat!, o.lng!);
          pLat = o.lat!;
          pLng = o.lng!;
        });
        return d;
      };

      let improved = true;
      let bestDist = calculateRouteDist(optimizedStops);

      while (improved) {
        improved = false;
        for (let i = 0; i < optimizedStops.length - 1; i++) {
          for (let k = i + 1; k < optimizedStops.length; k++) {
            // Swap segment i to k
            const newStops = [
              ...optimizedStops.slice(0, i),
              ...optimizedStops.slice(i, k + 1).reverse(),
              ...optimizedStops.slice(k + 1)
            ];
            const newDist = calculateRouteDist(newStops);
            if (newDist < bestDist) {
              optimizedStops = newStops;
              bestDist = newDist;
              improved = true;
            }
          }
        }
      }

      const deliveredStops = route.stops.filter(id => orders.find(o => o.id === id)?.status === 'Entregado');
      route.stops = [...deliveredStops, ...optimizedStops];
    });

    broadcast({ type: "INIT", data: { orders, drivers, routes } });
    res.json({ message: "Rutas optimizadas con éxito", routes });
  });

  app.post("/api/whatsapp/alert", (req, res) => {
    const { orderId } = req.body;
    console.log(`Simulating WhatsApp alert for order ${orderId}`);
    res.json({ success: true, message: `Alert sent for order ${orderId}` });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
