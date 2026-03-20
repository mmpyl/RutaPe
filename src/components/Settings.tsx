import React, { useState } from 'react';
import { 
  Key, 
  Webhook, 
  Globe, 
  Copy, 
  Check, 
  RefreshCw, 
  Shield, 
  Zap,
  Smartphone
} from 'lucide-react';

const Settings: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const apiKey = "lp_live_51N9X2kL8vQ7mP4zR9sT1uV2wX3yZ4aB5c";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Integración y API</h2>
        <p className="text-slate-500 font-medium mt-1">Conecta tus sistemas externos con LogiPerú de forma segura.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Keys */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Claves de API</h3>
                <p className="text-sm text-slate-400">Usa esta clave para autenticar tus peticiones REST.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key (Producción)</label>
              <div className="flex gap-3">
                <div className="flex-1 bg-slate-50 px-6 py-4 rounded-2xl font-mono text-sm text-slate-600 border border-slate-100 flex items-center overflow-hidden">
                  <span className="truncate">{apiKey}</span>
                </div>
                <button 
                  onClick={() => handleCopy(apiKey, 'api')}
                  className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center min-w-[56px]"
                >
                  {copied === 'api' ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                <Shield size={12} className="text-emerald-500" /> Creada el 18 de Marzo, 2026
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Mantén tu clave en secreto. Si crees que ha sido comprometida, puedes regenerarla en cualquier momento.
              </p>
              <button className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
                <RefreshCw size={14} /> Regenerar
              </button>
            </div>
          </div>

          {/* Webhooks */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Webhook size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Webhooks</h3>
                <p className="text-sm text-slate-400">Recibe notificaciones en tiempo real en tu servidor.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                    <Globe size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">https://api.tu-tienda.com/webhooks/logiperu</div>
                    <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Activo</div>
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">Editar</button>
              </div>

              <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <PlusIcon size={18} /> Añadir Endpoint
              </button>
            </div>
          </div>
        </div>

        {/* Integration Stats */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] text-white space-y-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />
            
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-6">Estado de Integración</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Uptime API</span>
                  </div>
                  <span className="text-sm font-bold">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} className="text-blue-400" />
                    <span className="text-sm text-slate-400">WhatsApp API</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Conectado</span>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Uso de API (Mes)</div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]" />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-slate-500">6,500 / 10,000</span>
                    <span className="text-[10px] font-bold text-slate-500">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100">
            <h4 className="text-sm font-bold text-emerald-900 mb-4">¿Necesitas ayuda técnica?</h4>
            <p className="text-xs text-emerald-700 leading-relaxed mb-6">
              Nuestra documentación para desarrolladores incluye SDKs para Node.js, Python y PHP.
            </p>
            <button className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
              Ver Documentación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default Settings;
