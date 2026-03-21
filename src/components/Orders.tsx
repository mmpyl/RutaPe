import React, { useMemo, useState } from 'react';
import { Search, Filter, Plus, MessageSquare, Eye, Trash2, Upload, Navigation } from 'lucide-react';
import { BulkImportedOrder, Order } from '../types';
import BulkImportModal from './Modals/BulkImportModal';

interface OrdersProps {
  orders: Order[];
  onNewOrder: () => void;
  onSendAlert: (id: string) => void;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkImport?: (orders: BulkImportedOrder[]) => void;
  onTrackOrder?: (id: string) => void;
}

const Orders: React.FC<OrdersProps> = ({
  orders,
  onNewOrder,
  onSendAlert,
  onViewDetail,
  onDelete,
  onBulkImport,
  onTrackOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      order.client.toLowerCase().includes(searchTerm.toLowerCase())
      || order.id.includes(searchTerm)
      || order.address.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [orders, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Pedidos</h2>
          <p className="text-slate-500">Administra y filtra todos tus despachos</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <Upload size={18} /> Importar CSV
          </button>
          <button
            onClick={onNewOrder}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Nuevo Pedido
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, ID o dirección..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-3 bg-slate-50 text-slate-600 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-100 transition-colors">
            <Filter size={18} /> Filtros
          </button>
          <button className="px-4 py-3 bg-slate-50 text-slate-600 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-slate-100 transition-colors">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Carrier</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Items</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6 font-mono text-xs font-bold text-slate-900">#{order.id}</td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-900">{order.client}</div>
                    <div className="text-[10px] text-slate-400">{order.address}</div>
                  </td>
                  <td className="px-8 py-6">
                    {order.carrier ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-[8px] font-bold text-slate-500 border border-slate-200">
                          {order.carrierLogo}
                        </div>
                        <span className="text-xs font-medium text-slate-700">{order.carrier}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">No asignado</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${order.color}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-600">{order.items}</td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-900">S/ {order.value.toFixed(2)}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSendAlert(order.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare size={16} />
                      </button>
                      {order.status === 'En Ruta' && onTrackOrder && (
                        <button
                          onClick={() => onTrackOrder(order.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Seguir en Mapa"
                        >
                          <Navigation size={16} />
                        </button>
                      )}
                      <button onClick={() => onViewDetail(order.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Detalle">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onDelete(order.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={(newOrders) => {
          onBulkImport?.(newOrders);
          setIsBulkModalOpen(false);
        }}
      />
    </div>
  );
};

export default Orders;
