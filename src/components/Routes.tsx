import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, MapPin, Navigation, X, Package } from 'lucide-react';
import { Driver, Order, Route, RouteOptimizationResponse } from '../types';
import Map from './Map';

interface RoutesProps {
  routes: Route[];
  drivers: Driver[];
  orders: Order[];
  trackedOrderId: string | null;
  setTrackedOrderId: (id: string | null) => void;
  isMapVisible: boolean;
  setIsMapVisible: (visible: boolean) => void;
  onOptimize: () => Promise<RouteOptimizationResponse>;
}

const Routes: React.FC<RoutesProps> = ({
  routes,
  drivers,
  orders,
  trackedOrderId,
  setTrackedOrderId,
  isMapVisible,
  setIsMapVisible,
  onOptimize,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState<string | null>(null);
  const showFullMap = isMapVisible;
  const setShowFullMap = setIsMapVisible;

  const handleOptimize = async () => {
    setIsOptimizing(true);

    setOptimizationStep('Analizando demanda...');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setOptimizationStep('Balanceando carga de flota...');
    await new Promise((resolve) => setTimeout(resolve, 800));
    setOptimizationStep('Refinando trayectorias (2-Opt)...');

    try {
      await onOptimize();
      setOptimizationStep('¡Rutas optimizadas!');
      setTimeout(() => setOptimizationStep(null), 2000);
    } catch {
      setOptimizationStep('Error en optimización');
      setTimeout(() => setOptimizationStep(null), 3000);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Rutas Activas</h2>
          <p className="text-slate-500">Seguimiento de entregas en curso</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFullMap(!showFullMap)}
            className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {showFullMap ? <X size={18} /> : <Navigation size={18} />}
            {showFullMap ? 'Cerrar Mapa' : 'Ver Mapa Completo'}
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className={`relative overflow-hidden px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
              isOptimizing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <span>{optimizationStep}</span>
              </>
            ) : (
              <>
                {optimizationStep ? (
                  <span className="text-emerald-600">{optimizationStep}</span>
                ) : (
                  <>
                    <Navigation size={18} className="rotate-45" />
                    <span>Optimizar Nuevas Rutas</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`${showFullMap ? 'hidden lg:block lg:col-span-4' : 'lg:col-span-12'} space-y-6`}>
          <div className={`${showFullMap ? 'grid grid-cols-1' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
            {routes.map((route) => {
              const driver = drivers.find((currentDriver) => currentDriver.id === route.driverId);
              return (
                <div key={route.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs relative">
                        {driver?.avatar}
                        {driver?.carrierLogo && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-slate-100 rounded-md flex items-center justify-center text-[8px] font-black text-slate-900 shadow-sm">
                            {driver.carrierLogo}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{driver?.name}</div>
                        <div className="text-[10px] text-slate-400">{driver?.vehicle}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full uppercase">
                      {route.status}
                    </span>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Progreso</span>
                      <span>{route.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${route.progress}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    <div className="space-y-3 pt-2">
                      {route.stops.map((stopId, index) => {
                        const order = orders.find((currentOrder) => currentOrder.id === stopId);
                        const isTracked = trackedOrderId === stopId;
                        return (
                          <button
                            key={stopId}
                            onClick={() => {
                              setTrackedOrderId(stopId);
                              setShowFullMap(true);
                            }}
                            className={`w-full flex gap-3 items-start text-left p-2 rounded-xl transition-colors ${isTracked ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                          >
                            <div className="flex flex-col items-center gap-1 mt-1">
                              <div className={`w-3 h-3 rounded-full border-2 ${order?.status === 'Entregado' ? 'bg-emerald-500 border-emerald-500' : isTracked ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'} z-10`} />
                              {index < route.stops.length - 1 && <div className="w-0.5 h-6 bg-slate-100" />}
                            </div>
                            <div className="flex-1">
                              <div className={`text-xs font-bold ${order?.status === 'Entregado' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                #{stopId} - {order?.client}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{order?.address}</div>
                            </div>
                            {isTracked && <MapPin size={14} className="text-blue-500 mt-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 flex gap-2">
                    <button
                      onClick={() => setShowFullMap(true)}
                      className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      Ver Mapa
                    </button>
                    <button className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
                      Contactar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {showFullMap && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-8 h-[700px] sticky top-8"
            >
              <Map orders={orders} drivers={drivers} trackedOrderId={trackedOrderId} />

              {trackedOrderId && (
                <div className="absolute top-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-xl flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                      <Package size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Siguiendo Pedido #{trackedOrderId}</div>
                      <div className="text-[10px] text-slate-500">Actualizado en tiempo real</div>
                    </div>
                  </div>
                  <button onClick={() => setTrackedOrderId(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[32px] p-8 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_35%)]" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Optimización IA</div>
            <h3 className="text-2xl font-black mb-2">Reduce hasta 32% el tiempo de entrega</h3>
            <p className="text-sm opacity-90 max-w-2xl">Nuestro motor considera tráfico histórico, capacidad vehicular y ventanas horarias para encontrar la mejor secuencia.</p>
          </div>
          <div className="hidden lg:block">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center">
              <ChevronRight size={40} className="rotate-[-45deg]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Routes;
