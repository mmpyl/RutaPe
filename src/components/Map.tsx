import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { CircleMarker, MapContainer, Popup, Polyline, TileLayer, useMap as useLeafletMap } from 'react-leaflet';
import { Driver, Order } from '../types';
import { Package, Truck, User } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';
const DEFAULT_CENTER = { lat: -12.0464, lng: -77.0297 };

interface MapProps {
  orders: Order[];
  drivers: Driver[];
  trackedOrderId?: string | null;
}

const TrackOrderOnGoogleMap: React.FC<MapProps> = ({ orders, trackedOrderId }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !trackedOrderId) return;
    const order = orders.find((currentOrder) => currentOrder.id === trackedOrderId);
    if (order?.lat && order?.lng) {
      map.panTo({ lat: order.lat, lng: order.lng });
      map.setZoom(15);
    }
  }, [map, trackedOrderId, orders]);

  return null;
};

const GoogleRoutesOverlay: React.FC<MapProps> = ({ orders, drivers }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    polylinesRef.current = [];

    const activeDrivers = drivers.filter((driver) => driver.status === 'En Ruta' && driver.lat && driver.lng);

    activeDrivers.forEach(async (driver) => {
      const driverOrder = orders.find(
        (order) => order.driverId === driver.id && (order.status === 'En Ruta' || order.status === 'Pendiente'),
      );

      if (!driverOrder?.lat || !driverOrder?.lng) return;

      try {
        const { routes } = await (routesLib as any).Route.computeRoutes({
          origin: { lat: driver.lat!, lng: driver.lng! },
          destination: { lat: driverOrder.lat, lng: driverOrder.lng },
          travelMode: 'DRIVING',
          fields: ['path', 'viewport'],
        });

        if (!routes?.[0]) return;

        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#10b981',
            strokeOpacity: 0.6,
            strokeWeight: 4,
          });
          polyline.setMap(map);
        });
        polylinesRef.current.push(...newPolylines);
      } catch (error) {
        console.error('Error computing route:', error);
      }
    });

    return () => {
      polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    };
  }, [routesLib, map, drivers, orders]);

  return null;
};

const GoogleMarkers: React.FC<MapProps> = ({ orders, drivers }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  return (
    <>
      {orders.filter((order) => order.lat && order.lng).map((order) => (
        <AdvancedMarker
          key={order.id}
          position={{ lat: order.lat!, lng: order.lng! }}
          onClick={() => setSelectedOrder(order)}
        >
          <div
            className={`rounded-full border-2 border-white p-1.5 shadow-lg ${
              order.status === 'Entregado'
                ? 'bg-emerald-500'
                : order.status === 'En Ruta'
                  ? 'bg-blue-500'
                  : order.status === 'Retrasado'
                    ? 'bg-red-500'
                    : 'bg-slate-400'
            }`}
          >
            <Package size={14} className="text-white" />
          </div>
        </AdvancedMarker>
      ))}

      {drivers.filter((driver) => driver.lat && driver.lng).map((driver) => (
        <AdvancedMarker
          key={driver.id}
          position={{ lat: driver.lat!, lng: driver.lng! }}
          onClick={() => setSelectedDriver(driver)}
        >
          <div className="group relative flex items-center justify-center">
            {driver.status === 'En Ruta' && <div className="absolute h-12 w-12 animate-ping rounded-full bg-emerald-500/20" />}
            <div className="relative z-10 flex items-center gap-2 rounded-2xl border-2 border-emerald-500 bg-slate-900 p-2 shadow-xl transition-transform hover:scale-110">
              {driver.carrierLogo && (
                <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-md border border-slate-100 bg-white text-[8px] font-black text-slate-900 shadow-sm">
                  {driver.carrierLogo}
                </div>
              )}
              <Truck size={16} className="text-emerald-500" />
              <span className="whitespace-nowrap pr-1 text-[10px] font-bold text-white">{driver.name.split(' ')[0]}</span>
            </div>
          </div>
        </AdvancedMarker>
      ))}

      {selectedOrder && (
        <InfoWindow
          position={{ lat: selectedOrder.lat!, lng: selectedOrder.lng! }}
          onCloseClick={() => setSelectedOrder(null)}
        >
          <div className="min-w-[200px] p-2">
            <div className="mb-2 flex items-center gap-2">
              <Package size={16} className="text-slate-400" />
              <span className="font-bold text-slate-900">Pedido #{selectedOrder.id}</span>
            </div>
            <div className="mb-1 text-xs text-slate-600"><strong>Cliente:</strong> {selectedOrder.client}</div>
            <div className="mb-2 text-xs text-slate-600"><strong>Dirección:</strong> {selectedOrder.address}</div>
            <div className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase ${selectedOrder.color}`}>
              {selectedOrder.status}
            </div>
          </div>
        </InfoWindow>
      )}

      {selectedDriver && (
        <InfoWindow
          position={{ lat: selectedDriver.lat!, lng: selectedDriver.lng! }}
          onCloseClick={() => setSelectedDriver(null)}
        >
          <div className="min-w-[200px] p-2">
            <div className="mb-2 flex items-center gap-2">
              <User size={16} className="text-emerald-600" />
              <span className="font-bold text-slate-900">{selectedDriver.name}</span>
            </div>
            <div className="mb-1 text-xs text-slate-600"><strong>Vehículo:</strong> {selectedDriver.vehicle}</div>
            <div className="mb-2 text-xs text-slate-600"><strong>Pedidos:</strong> {selectedDriver.orders}</div>
            <div className="inline-block rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
              {selectedDriver.status}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const LeafletTracker: React.FC<MapProps> = ({ orders, trackedOrderId }) => {
  const map = useLeafletMap();

  useEffect(() => {
    if (!trackedOrderId) return;
    const order = orders.find((currentOrder) => currentOrder.id === trackedOrderId);
    if (order?.lat && order?.lng) {
      map.setView([order.lat, order.lng], 15);
    }
  }, [map, trackedOrderId, orders]);

  return null;
};

const LeafletFallbackMap: React.FC<MapProps> = ({ orders, drivers, trackedOrderId }) => {
  const routeSegments = useMemo(
    () =>
      drivers
        .filter((driver) => driver.status === 'En Ruta' && driver.lat && driver.lng)
        .map((driver) => {
          const driverOrder = orders.find(
            (order) => order.driverId === driver.id && (order.status === 'En Ruta' || order.status === 'Pendiente') && order.lat && order.lng,
          );

          if (!driverOrder?.lat || !driverOrder?.lng) {
            return null;
          }

          return {
            id: `${driver.id}-${driverOrder.id}`,
            points: [
              [driver.lat!, driver.lng!] as [number, number],
              [driverOrder.lat, driverOrder.lng] as [number, number],
            ],
          };
        })
        .filter((segment): segment is { id: string; points: [number, number][] } => segment !== null),
    [drivers, orders],
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-slate-200 shadow-inner">
      <div className="absolute left-4 top-4 z-[500] rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 text-xs font-medium text-slate-600 shadow-lg backdrop-blur">
        <div className="font-bold text-emerald-700">Fallback Leaflet activo</div>
        <div>Mapa operativo sin Google Maps API key.</div>
      </div>
      <MapContainer center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LeafletTracker orders={orders} trackedOrderId={trackedOrderId} />

        {orders.filter((order) => order.lat && order.lng).map((order) => (
          <CircleMarker
            key={order.id}
            center={[order.lat!, order.lng!]}
            pathOptions={{
              color:
                order.status === 'Entregado'
                  ? '#10b981'
                  : order.status === 'En Ruta'
                    ? '#3b82f6'
                    : order.status === 'Retrasado'
                      ? '#ef4444'
                      : '#94a3b8',
              fillOpacity: 0.9,
            }}
            radius={8}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-bold">Pedido #{order.id}</div>
                <div><strong>Cliente:</strong> {order.client}</div>
                <div><strong>Dirección:</strong> {order.address}</div>
                <div><strong>Estado:</strong> {order.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {drivers.filter((driver) => driver.lat && driver.lng).map((driver) => (
          <CircleMarker
            key={driver.id}
            center={[driver.lat!, driver.lng!]}
            pathOptions={{ color: '#0f172a', fillColor: '#10b981', fillOpacity: 0.95 }}
            radius={10}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="font-bold">{driver.name}</div>
                <div><strong>Vehículo:</strong> {driver.vehicle}</div>
                <div><strong>Pedidos:</strong> {driver.orders}</div>
                <div><strong>Estado:</strong> {driver.status}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {routeSegments.map((segment) => (
          <Polyline key={segment.id} positions={segment.points} pathOptions={{ color: '#10b981', weight: 4, opacity: 0.8 }} />
        ))}
      </MapContainer>
    </div>
  );
};

const Map: React.FC<MapProps> = (props) => {
  if (!hasValidKey) {
    return <LeafletFallbackMap {...props} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[32px] border border-slate-200 shadow-inner">
      <APIProvider apiKey={API_KEY} version="weekly">
        <GoogleMap
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          className="h-full w-full"
          disableDefaultUI={true}
          zoomControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          <TrackOrderOnGoogleMap {...props} />
          <GoogleRoutesOverlay {...props} />
          <GoogleMarkers {...props} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
};

export default Map;
