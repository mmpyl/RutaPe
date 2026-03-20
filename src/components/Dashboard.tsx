import React, { useMemo } from 'react';
import { 
  CheckCircle2, 
  Truck, 
  Clock, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  MoreVertical,
  TrendingUp,
  BadgeCheck,
  Wallet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import { Order, Driver } from '../types';
import Map from './Map';
import { getCarrierPerformance, getDashboardStats } from '../shared/selectors/carrierMetrics';

const CHART_DATA = [
  { name: 'Lun', entregas: 45, fallidas: 2 },
  { name: 'Mar', entregas: 52, fallidas: 5 },
  { name: 'Mie', entregas: 38, fallidas: 1 },
  { name: 'Jue', entregas: 65, fallidas: 3 },
  { name: 'Vie', entregas: 48, fallidas: 4 },
  { name: 'Sab', entregas: 70, fallidas: 2 },
  { name: 'Dom', entregas: 25, fallidas: 0 },
];

const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours.toFixed(1)} h`;
  }

  return `${Math.round(minutes)} min`;
};

const formatCurrency = (amount: number) => `S/ ${amount.toFixed(0)}`;

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
  const stats = useMemo(() => getDashboardStats(orders), [orders]);
  const carrierPerformance = useMemo(() => getCarrierPerformance(orders), [orders]);

  const leadingCarrier = carrierPerformance[0];
  const lowestCostCarrier = [...carrierPerformance].sort((a, b) => a.avgCost - b.avgCost)[0];
  const mostIncidentsCarrier = [...carrierPerformance].sort((a, b) => b.delayedOrders - a.delayedOrders)[0];

  const carrierPerformance = useMemo(() => {
    const grouped: Record<string, Order[]> = {};

    orders.forEach((order) => {
      const carrierName = order.carrier || 'Flota Propia';
      if (!grouped[carrierName]) {
        grouped[carrierName] = [];
      }
      grouped[carrierName].push(order);
    });

    return Object.entries(grouped)
      .map(([carrier, carrierOrders]: [string, Order[]]) => {
        const completedOrders = carrierOrders.filter(order => order.status === 'Entregado');
        const activeOrders = carrierOrders.filter(order => order.status !== 'Pendiente');
        const delayedOrders = carrierOrders.filter(order => order.status === 'Retrasado').length;
        const onTimeOrders = carrierOrders.filter(order => order.status !== 'Retrasado').length;
        const avgDeliveryMinutes = (completedOrders.length ? completedOrders : activeOrders)
          .reduce((sum, order) => sum + parseRelativeTimeToMinutes(order.time), 0) /
          Math.max((completedOrders.length ? completedOrders : activeOrders).length, 1);
        const avgCost = carrierOrders.reduce((sum, order) => sum + order.value, 0) / carrierOrders.length;
        const sla = Math.round((onTimeOrders / carrierOrders.length) * 100);
        const deliveredRate = Math.round((completedOrders.length / carrierOrders.length) * 100);
        const avgHours = Number((avgDeliveryMinutes / 60).toFixed(1));

        return {
          carrier,
          logo: carrierOrders[0]?.carrierLogo || carrier.slice(0, 2).toUpperCase(),
          color: CARRIER_COLORS[carrier] || '#64748b',
          totalOrders: carrierOrders.length,
          delayedOrders,
          sla,
          deliveredRate,
          avgDeliveryMinutes,
          avgHours,
          avgCost,
        };
      })
      .sort((a, b) => b.sla - a.sla || a.avgDeliveryMinutes - b.avgDeliveryMinutes);
  }, [orders]);

  const leadingCarrier = carrierPerformance[0];
  const lowestCostCarrier = [...carrierPerformance].sort((a, b) => a.avgCost - b.avgCost)[0];
  const mostIncidentsCarrier = [...carrierPerformance].sort((a, b) => b.delayedOrders - a.delayedOrders)[0];

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

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
              SLA Monitoring
            </div>
            <h3 className="font-bold text-slate-900 text-xl">Análisis de Rendimiento por Carrier</h3>
            <p className="text-sm text-slate-500 max-w-3xl mt-1">
              Compara el cumplimiento de promesa, el tiempo promedio de entrega y el costo medio por despacho entre carriers para decidir a quién asignar más volumen.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">Promedio de entrega basado en pedidos completados y activos</div>
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">SLA = % de pedidos sin retraso registrado</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
              <BadgeCheck size={16} /> Mejor cumplimiento
            </div>
            <div className="text-2xl font-black text-slate-900">{leadingCarrier?.carrier ?? 'Sin datos'}</div>
            <div className="text-sm text-slate-500 mt-1">
              {leadingCarrier ? `${leadingCarrier.sla}% SLA · ${formatDuration(leadingCarrier.avgDeliveryMinutes)} promedio` : 'Aún no hay carriers suficientes para comparar'}
            </div>
          </div>
          <div className="rounded-3xl bg-blue-50 border border-blue-100 p-5">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
              <Wallet size={16} /> Opción más eficiente en costo
            </div>
            <div className="text-2xl font-black text-slate-900">{lowestCostCarrier?.carrier ?? 'Sin datos'}</div>
            <div className="text-sm text-slate-500 mt-1">
              {lowestCostCarrier ? `${formatCurrency(lowestCostCarrier.avgCost)} promedio por envío` : 'Sin volumen suficiente para análisis de costo'}
            </div>
          </div>
          <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-3">
              <TrendingUp size={16} /> Riesgo a monitorear
            </div>
            <div className="text-2xl font-black text-slate-900">{mostIncidentsCarrier?.carrier ?? 'Sin datos'}</div>
            <div className="text-sm text-slate-500 mt-1">
              {mostIncidentsCarrier ? `${mostIncidentsCarrier.delayedOrders} incidencias · ${mostIncidentsCarrier.sla}% SLA` : 'Sin incidencias registradas'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carrierPerformance} barGap={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="carrier" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Tiempo Promedio (h)') return [`${value.toFixed(1)} h`, name];
                    if (name === 'Costo Promedio (S/)') return [`S/ ${value.toFixed(2)}`, name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="avgHours" name="Tiempo Promedio (h)" radius={[10, 10, 0, 0]}>
                  {carrierPerformance.map((entry) => (
                    <Cell key={`${entry.carrier}-time`} fill={entry.color} fillOpacity={0.95} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="avgCost" name="Costo Promedio (S/)" radius={[10, 10, 0, 0]} fill="#cbd5e1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-2 space-y-4">
            {carrierPerformance.map((carrier) => (
              <div key={carrier.carrier} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl text-white font-black text-xs flex items-center justify-center shadow-sm" style={{ backgroundColor: carrier.color }}>
                      {carrier.logo}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{carrier.carrier}</div>
                      <div className="text-[11px] text-slate-400">{carrier.totalOrders} pedidos evaluados</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${carrier.sla >= 80 ? 'bg-emerald-100 text-emerald-700' : carrier.sla >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    SLA {carrier.sla}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white rounded-2xl p-3 border border-slate-100">
                    <div className="text-lg font-black text-slate-900">{formatDuration(carrier.avgDeliveryMinutes)}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tiempo</div>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-slate-100">
                    <div className="text-lg font-black text-slate-900">{formatCurrency(carrier.avgCost)}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Costo</div>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-slate-100">
                    <div className="text-lg font-black text-slate-900">{carrier.deliveredRate}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entregado</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
