import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Navigation, 
  Users, 
  Settings, 
  LogOut, 
  ArrowLeft 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onBackToPlan: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onBackToPlan }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel Control', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos', icon: Package },
    { id: 'rutas', label: 'Rutas Activas', icon: Navigation },
    { id: 'repartidores', label: 'Repartidores', icon: Users },
    { id: 'configuracion', label: 'Integración API', icon: Settings },
  ];

  return (
    <aside className="w-80 bg-slate-900 text-white flex flex-col p-8 h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <TruckIcon className="text-white" size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter">LOGI<span className="text-emerald-500">PERÚ</span></h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'group-hover:text-emerald-400'} />
            <span className="font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
        <button 
          onClick={onBackToPlan}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:text-emerald-400" />
          <span className="font-bold text-sm">Volver al Plan</span>
        </button>
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center font-bold">MP</div>
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
};

const TruckIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-2.18-2.725A1 1 0 0 0 18.82 9H15" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

export default Sidebar;
