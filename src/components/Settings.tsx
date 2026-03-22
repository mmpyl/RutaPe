import React from 'react';
import {
  Globe,
  Key,
  Lock,
  Plus,
  ServerCog,
  Shield,
  Smartphone,
  Webhook,
  Zap,
} from 'lucide-react';

const integrationStats = [
  { icon: Zap, label: 'Uptime API', value: '99.9%', iconClassName: 'text-emerald-400', valueClassName: 'text-white' },
  { icon: Smartphone, label: 'WhatsApp API', value: 'Conectado', iconClassName: 'text-blue-400', valueClassName: 'text-emerald-400' },
  { icon: Shield, label: 'Exposición de claves', value: 'Protegida', iconClassName: 'text-emerald-400', valueClassName: 'text-emerald-400' },
] as const;

const securityHighlights = [
  {
    icon: ServerCog,
    title: 'Estado de credencial',
    description:
      'Configura la clave en el servidor o en secretos del entorno. El navegador nunca debe recibir ni renderizar el valor completo.',
  },
  {
    icon: Shield,
    title: 'Política recomendada',
    description: 'Usa rotación periódica, permisos mínimos y auditoría de acceso para todas las credenciales operativas.',
  },
] as const;

const Settings: React.FC = () => {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Integración y API</h2>
        <p className="mt-1 font-medium text-slate-500">Conecta tus sistemas externos con LogiPerú de forma segura.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <article className="space-y-8 rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                <Key size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Claves de API</h3>
                <p className="text-sm text-slate-400">
                  Las credenciales sensibles se gestionan fuera del cliente para evitar exposiciones accidentales.
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-[32px] border border-emerald-100 bg-emerald-50 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl border border-emerald-100 bg-white p-3 text-emerald-600 shadow-sm">
                  <Lock size={20} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Protección activa</span>
                    <span className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-700">
                      Backend Managed
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">La clave de producción no se muestra en el frontend</h4>
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                    Este panel confirma el estado de la integración, pero las credenciales reales deben almacenarse en variables
                    de entorno o en un backend seguro.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                {securityHighlights.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Icon size={16} className="text-emerald-600" />
                      {title}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-6">
              <p className="max-w-md text-xs leading-relaxed text-slate-400">
                Si sospechas que una credencial fue comprometida, regénérala desde tu proveedor y actualiza el secreto en el
                backend.
              </p>
              <button className="flex cursor-default items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
                <Shield size={14} />
                Visible solo como estado seguro
              </button>
            </div>
          </article>

          <article className="space-y-8 rounded-[40px] border border-slate-100 bg-white p-10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                <Webhook size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Webhooks</h3>
                <p className="text-sm text-slate-400">Recibe notificaciones en tiempo real en tu servidor.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <Globe size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">https://api.tu-tienda.com/webhooks/logiperu</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Activo</div>
                  </div>
                </div>
                <button className="text-xs font-bold text-slate-400 transition-colors hover:text-slate-900">Editar</button>
              </div>

              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-bold text-slate-400 transition-all hover:bg-slate-50">
                <Plus size={18} />
                Añadir Endpoint
              </button>
            </div>
          </article>
        </section>

        <aside className="space-y-8">
          <article className="relative space-y-8 overflow-hidden rounded-[40px] bg-slate-900 p-10 text-white">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />

            <div className="relative z-10">
              <h4 className="mb-6 text-lg font-bold">Estado de Integración</h4>
              <div className="space-y-6">
                {integrationStats.map(({ icon: Icon, label, value, iconClassName, valueClassName }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={iconClassName} />
                      <span className="text-sm text-slate-400">{label}</span>
                    </div>
                    <span className={`text-sm font-bold ${valueClassName}`}>{value}</span>
                  </div>
                ))}

                <div className="border-t border-white/10 pt-4">
                  <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Uso de API (Mes)</div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[65%] bg-emerald-500" />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-[10px] font-bold text-slate-500">6,500 / 10,000</span>
                    <span className="text-[10px] font-bold text-slate-500">65%</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[40px] border border-emerald-100 bg-emerald-50 p-8">
            <h4 className="mb-4 text-sm font-bold text-emerald-900">¿Necesitas ayuda técnica?</h4>
            <p className="mb-6 text-xs leading-relaxed text-emerald-700">
              Nuestra documentación para desarrolladores incluye SDKs para Node.js, Python y PHP.
            </p>
            <button className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700">
              Ver Documentación
            </button>
          </article>
        </aside>
      </div>
    </div>
  );
};

export default Settings;
