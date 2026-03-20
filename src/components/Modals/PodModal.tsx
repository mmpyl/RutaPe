import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, CheckCircle2 } from 'lucide-react';

interface PodModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  onSubmit: (data: { signature: string, photo: string }) => void;
}

const PodModal: React.FC<PodModalProps> = ({ isOpen, orderId, onClose, onSubmit }) => {
  if (!isOpen || !orderId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
        >
          <div className="p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Prueba de Entrega</h3>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-900">Pedido #{orderId}</div>
                  <div className="text-xs text-emerald-600">Confirma la entrega exitosa</div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Firma Digital</label>
                <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-crosshair">
                  <span className="text-xs font-bold text-slate-300">Firma aquí</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Foto de Evidencia</label>
                <button className="w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-slate-100 transition-colors">
                  <Camera className="text-slate-300" size={32} />
                  <span className="text-xs font-bold text-slate-400">Tomar Foto</span>
                </button>
              </div>

              <button 
                onClick={() => onSubmit({ signature: 'signed', photo: 'photo_url' })}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                Confirmar Entrega
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PodModal;
