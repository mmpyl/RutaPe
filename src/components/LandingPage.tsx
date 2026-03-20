import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  BarChart3, 
  MapPin 
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">LOGI<span className="text-emerald-500">PERÚ</span></h1>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500">
          <a href="#problema" className="hover:text-emerald-600 transition-colors">Problema</a>
          <a href="#solucion" className="hover:text-emerald-600 transition-colors">Solución</a>
          <a href="#mvp" className="hover:text-emerald-600 transition-colors">MVP</a>
          <button 
            onClick={onEnterApp}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Entrar al MVP
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-10"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
            <TrendingUp size={14} /> Startup SaaS Logística Perú
          </div>
          <h2 className="text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
            Digitaliza tu <span className="text-emerald-500">Logística</span> de Última Milla.
          </h2>
          <p className="text-xl text-slate-500 leading-relaxed max-w-xl">
            Deja atrás el Excel y WhatsApp. Toma el control total de tus despachos con nuestra plataforma diseñada para PYMEs peruanas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onEnterApp}
              className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 group"
            >
              Probar Demo MVP <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white border-2 border-slate-100 text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
              Ver Plan de Negocio
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full" />
          <div className="relative bg-white p-4 rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
            <img 
              src="https://picsum.photos/seed/logistics/1200/800" 
              alt="Dashboard Preview" 
              className="rounded-[32px] w-full h-auto"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-10 right-10 bg-white p-6 rounded-3xl shadow-xl border border-slate-50 animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400">Entrega Exitosa</div>
                  <div className="text-sm font-black text-slate-900">Pedido #4021</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section id="problema" className="py-32 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">El Dolor Logístico en Perú</h3>
            <p className="text-slate-500 text-lg">Las PYMEs pierden hasta un 30% de eficiencia por procesos manuales e informales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Caos en WhatsApp", desc: "Información dispersa, pérdida de pedidos y falta de confirmación real.", icon: Smartphone },
              { title: "Cero Visibilidad", desc: "No saber dónde está el repartidor ni cuándo llegará el pedido al cliente.", icon: MapPin },
              { title: "Excel Infinito", desc: "Horas perdidas digitando datos que no generan insights para el negocio.", icon: BarChart3 }
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-[40px] bg-slate-50 hover:bg-emerald-50 transition-colors group">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <item.icon size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucion" className="py-32 px-8 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 relative z-10">
            <h3 className="text-5xl font-black leading-tight tracking-tight">Una Solución <span className="text-emerald-400">Todo en Uno</span> para tu Negocio.</h3>
            <div className="space-y-6">
              {[
                "Optimización de rutas inteligente",
                "Seguimiento en tiempo real vía GPS",
                "Pruebas de entrega digitales (Firma y Foto)",
                "Alertas automáticas por WhatsApp",
                "Dashboard de rendimiento y KPIs"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={14} />
                  </div>
                  <span className="text-lg text-slate-300 font-medium">{text}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={onEnterApp}
              className="bg-emerald-500 text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all flex items-center gap-3"
            >
              Comenzar Ahora <ArrowRight size={20} />
            </button>
          </div>
          <div className="relative">
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[40px] border border-white/10">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-8 bg-emerald-500 rounded-3xl text-slate-900">
                  <div className="text-4xl font-black mb-2">98%</div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70">Entregas a Tiempo</div>
                </div>
                <div className="p-8 bg-white/10 rounded-3xl">
                  <div className="text-4xl font-black mb-2">-40%</div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70">Costos Operativos</div>
                </div>
                <div className="col-span-2 p-8 bg-white/10 rounded-3xl">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-4xl font-black mb-2">+25%</div>
                      <div className="text-xs font-bold uppercase tracking-widest opacity-70">Productividad Flota</div>
                    </div>
                    <BarChart3 size={48} className="text-emerald-500 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <Zap size={18} />
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900">LOGI<span className="text-emerald-500">PERÚ</span></h1>
          </div>
          <div className="flex gap-10 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-slate-900 transition-colors">Términos</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contacto</a>
          </div>
          <div className="text-sm text-slate-400 font-medium">
            © 2026 LogiPerú. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
