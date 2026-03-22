import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { BulkImportedOrder } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (orders: BulkImportedOrder[]) => void;
}

const MOCK_PARSED_ORDERS: BulkImportedOrder[] = [
  { client: 'Tienda Ripley S.A.', address: 'Av. Javier Prado 450, San Isidro', items: 3, value: 450.5 },
  { client: 'Saga Falabella', address: 'Calle Las Begonias 12, San Isidro', items: 1, value: 120 },
  { client: 'Mercado Libre Perú', address: 'Av. El Derby 250, Santiago de Surco', items: 5, value: 890 },
];

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    // En producción: parsear e.dataTransfer.files[0] con SheetJS/PapaParse
    setStep('preview');
  };

  const handleFileChange = () => {
    // En producción: parsear el archivo seleccionado
    setStep('preview');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
        >
          <div className="p-10">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                  Importación Masiva
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Carga tus pedidos desde Excel o CSV
                </p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {step === 'upload' ? (
              <div className="space-y-8">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`w-full py-20 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`p-6 rounded-3xl ${
                      isDragging ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 shadow-sm'
                    }`}
                  >
                    <Upload size={40} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900">Arrastra tu archivo aquí</div>
                    <div className="text-xs text-slate-400 mt-1">Soporta .xlsx, .csv (Máx 5MB)</div>
                  </div>
                  <label className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer">
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                  <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1">
                      Tip de Integración
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Descarga nuestra{' '}
                      <span className="font-bold underline cursor-pointer">plantilla estándar</span> para
                      asegurar que los campos se importen correctamente.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Vista Previa ({MOCK_PARSED_ORDERS.length} pedidos detectados)</div>
                  <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-500 font-bold uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Dirección</th>
                          <th className="px-6 py-4">Items</th>
                          <th className="px-6 py-4">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {MOCK_PARSED_ORDERS.map((order, index) => (
                          <tr key={`${order.client}-${index}`} className="text-slate-600">
                            <td className="px-6 py-4 font-bold">{order.client}</td>
                            <td className="px-6 py-4">{order.address}</td>
                            <td className="px-6 py-4">{order.items}</td>
                            <td className="px-6 py-4 font-mono">S/ {order.value.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep('upload')}
                    className="flex-1 py-5 rounded-2xl font-bold text-sm border-2 border-slate-100 text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Volver a Cargar
                  </button>
                  <button
                    onClick={() => onImport(MOCK_PARSED_ORDERS)}
                    className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Confirmar Importación
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BulkImportModal;
