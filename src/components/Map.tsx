import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  Pin, 
  InfoWindow, 
  useMap, 
  useMapsLibrary,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { Order, Driver } from '../types';
import { Truck, Package, User, Navigation } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapProps {
  orders: Order[];
  drivers: Driver[];
  trackedOrderId?: string | null;
}

const MapContent: React.FC<MapProps> = ({ orders, drivers, trackedOrderId }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Track specific order
  useEffect(() => {
    if (!map || !trackedOrderId) return;
    const order = orders.find(o => o.id === trackedOrderId);
    if (order && order.lat && order.lng) {
      map.panTo({ lat: order.lat, lng: order.lng });
      map.setZoom(15);
      setSelectedOrder(order);
    }
  }, [map, trackedOrderId, orders]);

  // Draw routes for active drivers
  useEffect(() => {
    if (!routesLib || !map) return;
    
    // Clear existing polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const activeDrivers = drivers.filter(d => d.status === 'En Ruta' && d.lat && d.lng);
    
    activeDrivers.forEach(async (driver) => {
      // Find the first pending or in-route order for this driver
      const driverOrder = orders.find(o => o.driverId === driver.id && (o.status === 'En Ruta' || o.status === 'Pendiente'));
      
      if (driverOrder && driverOrder.lat && driverOrder.lng) {
        try {
          const { routes } = await (routesLib as any).Route.computeRoutes({
            origin: { lat: driver.lat!, lng: driver.lng! },
            destination: { lat: driverOrder.lat, lng: driverOrder.lng },
            travelMode: 'DRIVING',
            fields: ['path', 'viewport'],
          });

          if (routes?.[0]) {
            const newPolylines = routes[0].createPolylines();
            newPolylines.forEach(p => {
              p.setOptions({
                strokeColor: '#10b981',
                strokeOpacity: 0.6,
                strokeWeight: 4,
              });
              p.setMap(map);
            });
            polylinesRef.current.push(...newPolylines);
          }
        } catch (error) {
          console.error('Error computing route:', error);
        }
      }
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, drivers, orders]);

  return (
    <>
      {/* Order Markers */}
      {orders.filter(o => o.lat && o.lng).map(order => (
        <AdvancedMarker 
          key={order.id} 
          position={{ lat: order.lat!, lng: order.lng! }}
          onClick={() => setSelectedOrder(order)}
        >
          <div className={`p-1.5 rounded-full border-2 border-white shadow-lg ${
            order.status === 'Entregado' ? 'bg-emerald-500' : 
            order.status === 'En Ruta' ? 'bg-blue-500' : 
            order.status === 'Retrasado' ? 'bg-red-500' : 'bg-slate-400'
          }`}>
            <Package size={14} className="text-white" />
          </div>
        </AdvancedMarker>
      ))}

      {/* Driver Markers */}
      {drivers.filter(d => d.lat && d.lng).map(driver => (
        <AdvancedMarker 
          key={driver.id} 
          position={{ lat: driver.lat!, lng: driver.lng! }}
          onClick={() => setSelectedDriver(driver)}
        >
          <div className="relative flex items-center justify-center group">
            {driver.status === 'En Ruta' && (
              <div className="absolute w-12 h-12 bg-emerald-500/20 rounded-full animate-ping" />
            )}
            <div className="p-2 bg-slate-900 rounded-2xl border-2 border-emerald-500 shadow-xl flex items-center gap-2 z-10 hover:scale-110 transition-transform relative">
              {driver.carrierLogo && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-100 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 shadow-sm">
                  {driver.carrierLogo}
                </div>
              )}
              <Truck size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-white pr-1 whitespace-nowrap">{driver.name.split(' ')[0]}</span>
            </div>
          </div>
        </AdvancedMarker>
      ))}

      {/* Info Windows */}
      {selectedOrder && (
        <InfoWindow 
          position={{ lat: selectedOrder.lat!, lng: selectedOrder.lng! }}
          onCloseClick={() => setSelectedOrder(null)}
        >
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-slate-400" />
              <span className="font-bold text-slate-900">Pedido #{selectedOrder.id}</span>
              {selectedOrder.carrier && (
                <span className="ml-auto text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {selectedOrder.carrierLogo}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mb-1"><strong>Cliente:</strong> {selectedOrder.client}</div>
            <div className="text-xs text-slate-600 mb-2"><strong>Dirección:</strong> {selectedOrder.address}</div>
            <div className={`text-[10px] font-bold px-2 py-1 rounded-full inline-block uppercase ${selectedOrder.color}`}>
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
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <User size={16} className="text-emerald-600" />
              <span className="font-bold text-slate-900">{selectedDriver.name}</span>
              {selectedDriver.carrier && (
                <span className="ml-auto text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {selectedDriver.carrierLogo}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-600 mb-1"><strong>Vehículo:</strong> {selectedDriver.vehicle}</div>
            <div className="text-xs text-slate-600 mb-2"><strong>Pedidos:</strong> {selectedDriver.orders}</div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-full inline-block uppercase bg-emerald-100 text-emerald-700">
              {selectedDriver.status}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const Map: React.FC<MapProps> = (props) => {
  if (!hasValidKey) {
    return (
      <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8 rounded-[32px] border border-slate-200">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Navigation size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Google Maps API Key Required</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Para ver el mapa en tiempo real y las rutas de despacho, necesitas configurar una clave de API de Google Maps Platform.
          </p>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 text-left space-y-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pasos para configurar:</p>
            <ol className="text-xs text-slate-600 space-y-3 list-decimal pl-4">
              <li>Obtén una clave en <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" className="text-emerald-600 font-bold underline">Google Cloud Console</a></li>
              <li>Abre <strong>Settings</strong> (icono de engranaje arriba a la derecha)</li>
              <li>Ve a <strong>Secrets</strong> y añade <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-[32px] overflow-hidden border border-slate-200 shadow-inner relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <GoogleMap
          defaultCenter={{ lat: -12.0464, lng: -77.0297 }}
          defaultZoom={12}
          mapId="DEMO_MAP_ID"
          className="w-full h-full"
          disableDefaultUI={true}
          zoomControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          <MapContent {...props} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
};

export default Map;
