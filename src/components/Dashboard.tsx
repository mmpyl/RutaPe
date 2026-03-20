import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  Truck, 
  Clock, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  Navigation, 
  MoreVertical 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Order, Driver } from '../types';
import Map from './Map';

const CHART_DATA = [
  { name: 'Lun', entregas: 45, fallidas: 2 },
  { name: 'Mar', entregas: 52, fallidas: 5 },
  { name: 'Mie', entregas: 38, fallidas: 1 },
  { name: 'Jue', entregas: 65, fallidas: 3 },
  { name: 'Vie', entregas: 48, fallidas: 4 },
  { name: 'Sab', entregas: 70, fallidas: 2 },
  { name: 'Dom', entregas: 25, fallidas: 0 },
];

const StatCard = ({ label, value, icon: Icon, color, trend }: { label: string, value: string | number, icon: any, color: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
  </div>
);

interface DashboardProps {
  orders: Order[];
  drivers: Driver[];
  onNewOrder: () => void;
  onViewAllOrders: () => void;
  onViewRoutes: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, drivers, onNewOrder, onViewAllOrders, onViewRoutes }) => {
  const stats = useMemo(() => ({
    entregados: orders.filter(o => o.status === 'Entregado').length,
    enRuta: orders.filter(o => o.status === 'En Ruta').length,
    pendientes: orders.filter(o => o.status === 'Pendiente').length,
    incidencias: orders.filter(o => o.status === 'Retrasado').length,
  }), [orders]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Vista General</h2>
          <p className="text-slate-500">Miércoles, 18 de Marzo 2026</p>
        </div>
        <button 
          onClick={onNewOrder}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Despacho
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Entregados" value={stats.entregados} icon={CheckCircle2} color="bg-emerald-600" trend="+12%" />
        <StatCard label="En Ruta" value={stats.enRuta} icon={Truck} color="bg-blue-600" />
        <StatCard label="Pendientes" value={stats.pendientes} icon={Clock} color="bg-amber-600" trend="-5%" />
        <StatCard label="Incidencias" value={stats.incidencias} icon={AlertCircle} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-900">Rendimiento Semanal</h3>
            <select className="text-xs font-bold text-slate-400 bg-slate-50 border-none rounded-lg px-3 py-2 outline-none">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorEntregas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="entregas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntregas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] overflow-hidden relative group h-[400px] lg:h-auto">
          <Map orders={orders} drivers={drivers} />
          <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 z-[1000]">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-bold text-sm">{drivers.filter(d => d.status === 'En Ruta').length} Vehículos Activos</div>
                <div className="text-white/50 text-[10px]">Actualizado en vivo</div>
              </div>
              <button 
                onClick={onViewRoutes}
                className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Pedidos Recientes</h3>
          <button onClick={onViewAllOrders} className="text-emerald-600 text-sm font-bold hover:underline">Ver todos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carrier</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4 font-mono text-xs font-bold text-slate-900">#{o.id}</td>
                  <td className="px-8 py-4">
                    <div className="text-sm font-bold text-slate-900">{o.client}</div>
                    <div className="text-[10px] text-slate-400">{o.address}</div>
                  </td>
                  <td className="px-8 py-4">
                    {o.carrier ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[6px] font-bold text-slate-500 border border-slate-200">
                          {o.carrierLogo}
                        </div>
                        <span className="text-[10px] font-medium text-slate-700">{o.carrier}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No asignado</span>
                    )}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${o.color}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-bold text-slate-900">S/ {o.value.toFixed(2)}</td>
                  <td className="px-8 py-4">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
