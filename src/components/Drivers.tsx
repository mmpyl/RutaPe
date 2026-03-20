import React from 'react';
import { Driver } from '../types';

interface DriversProps {
  drivers: Driver[];
}

const Drivers: React.FC<DriversProps> = ({ drivers }) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Operadores & Carriers</h2>
          <p className="text-slate-500">Gestión de flota multi-carrier y rendimiento</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-colors">
          + Conectar Carrier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {drivers.map((d) => (
          <div key={d.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-6 relative overflow-hidden">
            {d.carrier && (
              <div className="absolute top-0 right-0 bg-slate-900 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-widest">
                {d.carrier}
              </div>
            )}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-[24px] flex items-center justify-center font-bold text-2xl relative">
                {d.avatar}
                {d.carrierLogo && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-slate-50 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-900 shadow-sm">
                    {d.carrierLogo}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-900">{d.name}</h4>
                <p className="text-sm text-slate-400 mb-2">{d.vehicle}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    d.status === 'En Ruta' ? 'bg-blue-100 text-blue-700' : 
                    d.status === 'Disponible' ? 'bg-emerald-100 text-emerald-700' : 
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {d.status}
                  </span>
                  <span className="text-xs text-slate-400">{d.phone}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Eficiencia</div>
                <div className="text-3xl font-black text-emerald-600">{d.efficiency}%</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-50">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Entregas Hoy</div>
                <div className="text-lg font-bold text-slate-900">{d.orders}</div>
              </div>
              <div className="text-center border-x border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tiempo Prom.</div>
                <div className="text-lg font-bold text-slate-900">24m</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Calificación</div>
                <div className="text-lg font-bold text-slate-900">4.9/5</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                Ver Historial
              </button>
              <button className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                Asignar Pedidos
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drivers;
