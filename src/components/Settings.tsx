import React from 'react';
import {
  Key,
  Webhook,
  Globe,
  Shield,
  Zap,
  Smartphone,
  Lock,
  ServerCog,
} from 'lucide-react';
import { isBrowserDataMode } from '../shared/config/dataMode';
import { resetBrowserDemoState } from '../shared/demo/store';

const Settings: React.FC = () => {
  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Integración y API</h2>
        <p className="text-slate-500 font-medium mt-1">Conecta tus sistemas externos con LogiPerú de forma segura.</p>
      </div>

      {browserMode && (
        <div className="rounded-[32px] border border-blue-100 bg-blue-50 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Modo Netlify / Demo</div>
            <p className="text-sm text-blue-900 max-w-2xl">
              Esta versión usa datos persistidos en tu navegador para pruebas funcionales sin backend. Puedes reiniciar el estado cuando quieras.
            </p>
          </div>
          <button
            onClick={handleResetDemo}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            Reiniciar datos demo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Claves de API</h3>
                <p className="text-sm text-slate-400">Las credenciales sensibles se gestionan fuera del cliente para evitar exposiciones accidentales.</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm border border-emerald-100">
                  <Lock size={20} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Protección activa</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-full border border-emerald-200">Backend Managed</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">La clave de producción no se muestra en el frontend</h4>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Este panel confirma el estado de la integración, pero las credenciales reales deben almacenarse en variables de entorno o en un backend seguro.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <ServerCog size={16} className="text-emerald-600" /> Estado de credencial
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Configura la clave en el servidor o en secretos del entorno. El navegador nunca debe recibir ni renderizar el valor completo.
                  </p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-2">
                    <Shield size={16} className="text-emerald-600" /> Política recomendada
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Usa rotación periódica, permisos mínimos y auditoría de acceso para todas las credenciales operativas.
                  </p>
                </div>
              </div>
            </div>
          </div>

            <div className="pt-6 border-t border-slate-50 flex justify-between items-center gap-4">
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Si sospechas que una credencial fue comprometida, regénérala desde tu proveedor y actualiza el secreto en el backend.
              </p>
              <button className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl cursor-default">
                <Shield size={14} /> Visible solo como estado seguro
              </button>
            </div>
          </div>
        </div>

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
                  <div className="text-sm font-bold text-slate-900">
                    https://api.tu-tienda.com/webhooks/logiperu
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                    Activo
                  </div>
                </div>
              </div>
              <button className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors">
                Editar
              </button>
            </div>

            <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <PlusCircle size={18} /> Añadir Endpoint
            </button>
          </div>
        </div>
      </div>

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
                    <Shield size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Exposición de claves</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Protegida</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Exposición de claves</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Protegida</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Exposición de claves</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Protegida</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Exposición de claves</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Protegida</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Exposición de claves</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">Protegida</span>
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

export default Settings;
