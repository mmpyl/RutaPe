import React from 'react';
import {
  LayoutDashboard,
  Package,
  Navigation,
  Users,
  Settings,
  LogOut,
  ArrowLeft,
  Truck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBackToPlan: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard',      label: 'Panel Control',  icon: LayoutDashboard },
  { id: 'pedidos',        label: 'Pedidos',         icon: Package },
  { id: 'rutas',          label: 'Rutas Activas',   icon: Navigation },
  { id: 'repartidores',   label: 'Repartidores',    icon: Users },
  { id: 'configuracion',  label: 'Integración API', icon: Settings },
] as const;

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onBackToPlan }) => (
  <aside className="w-80 bg-slate-900 text-white flex flex-col p-8 h-screen sticky top-0">
    {/* Logo */}
    <div className="flex items-center gap-3 mb-12">
      <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <Truck className="text-white" size={22} strokeWidth={2.5} />
      </div>
      <h1 className="text-2xl font-black tracking-tighter">
        LOGI<span className="text-emerald-500">PERÚ</span>
      </h1>
    </div>

    {/* Navigation */}
    <nav className="flex-1 space-y-2">
      {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
            activeTab === id
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Icon
            size={20}
            className={activeTab === id ? 'text-white' : 'group-hover:text-emerald-400'}
          />
          <span className="font-bold text-sm">{label}</span>
        </button>
      ))}
    </nav>

    {/* Footer */}
    <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
      <button
        onClick={onBackToPlan}
        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group"
      >
        <ArrowLeft size={20} className="group-hover:text-emerald-400" />
        <span className="font-bold text-sm">Volver al Plan</span>
      </button>

      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center font-bold">
            MP
          </div>
          <div>
            <div className="text-xs font-bold">Moisés P.</div>
            <div className="text-[10px] text-slate-500">Administrador</div>
          </div>
        </div>
        <button className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
          <LogOut size={12} /> Cerrar Sesión
        </button>
      </div>
    </div>
  </aside>
);

export default Sidebar;
