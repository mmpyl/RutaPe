import React, { useMemo } from 'react';
import { Bell, Search, Calendar } from 'lucide-react';

const Header: React.FC = () => {
  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [],
  );

  return (
    <header className="bg-white border-b border-slate-100 p-8 flex justify-between items-center sticky top-0 z-50">
      <div className="flex-1 max-w-xl relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar pedidos, conductores, rutas..."
          className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        />
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{formattedDate}</span>
        </div>
        <div className="relative">
          <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors">
            <Bell size={20} />
          </button>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </div>
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold shadow-sm">
          MP
        </div>
      </div>
    </header>
  );
};

export default Header;
