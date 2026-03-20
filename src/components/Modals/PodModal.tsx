import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, CheckCircle2, Eraser, Upload, AlertTriangle, FileImage, UserRound, NotebookPen } from 'lucide-react';
import { PodProof } from '../../types';

interface PodModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
  onSubmit: (data: PodProof) => void;
}

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 180;

const PodModal: React.FC<PodModalProps> = ({ isOpen, orderId, onClose, onSubmit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signature, setSignature] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientDocument, setRecipientDocument] = useState('');
  const [notes, setNotes] = useState('');
  const [acknowledgedByDriver, setAcknowledgedByDriver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsDrawing(false);
    setHasSignature(false);
    setSignature('');
    setPhoto('');
    setPhotoName('');
    setRecipientName('');
    setRecipientDocument('');
    setNotes('');
    setAcknowledgedByDriver(false);
    setError(null);

    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });
  }, [isOpen, orderId]);

  if (!isOpen || !orderId) return null;

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasPoint(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finishSignature = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    setIsDrawing(false);
    if (canvas && hasSignature) {
      setSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignature('');
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result || ''));
      setPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!recipientName.trim()) {
      setError('Ingresa el nombre de quien recibe el pedido.');
      return;
    }

    if (!photo) {
      setError('Debes adjuntar una foto de evidencia antes de confirmar la entrega.');
      return;
    }

    if (!acknowledgedByDriver) {
      setError('Confirma que validaste físicamente la entrega con el cliente.');
      return;
    }

    setError(null);
    onSubmit({
      recipientName: recipientName.trim(),
      ...(recipientDocument.trim() ? { recipientDocument: recipientDocument.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(signature ? { signature } : {}),
      photo,
      deliveredAt: new Date().toISOString(),
      acknowledgedByDriver,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden"
        >
          <div className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                  <div className="text-xs text-emerald-600">Captura evidencia real de recepción antes de cerrar la entrega</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del receptor</label>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Ej: María Torres"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Documento (opcional)</label>
                  <input
                    value={recipientDocument}
                    onChange={(e) => setRecipientDocument(e.target.value)}
                    placeholder="DNI / referencia"
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Firma Digital (opcional)</label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-xs font-bold text-slate-500 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Eraser size={14} /> Limpiar firma
                  </button>
                </div>
                <div className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-50">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishSignature}
                    onPointerLeave={finishSignature}
                    className="w-full h-48 cursor-crosshair touch-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Foto de Evidencia (obligatoria)</label>
                  {photoName && <span className="text-xs font-bold text-emerald-600">{photoName}</span>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-slate-100 transition-colors"
                >
                  {photo ? <FileImage className="text-emerald-500" size={32} /> : <Camera className="text-slate-300" size={32} />}
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                    <Upload size={14} /> {photo ? 'Cambiar Foto de Evidencia' : 'Subir Foto de Evidencia'}
                  </span>
                </button>
                {photo && (
                  <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-2">
                    <img src={photo} alt="Evidencia POD" className="w-full h-56 object-cover rounded-[20px]" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notas de Entrega (opcional)</label>
                <div className="relative">
                  <NotebookPen className="absolute left-4 top-4 text-slate-300" size={18} />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Ej: Cliente recibió en portería, caja sin daños visibles."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium resize-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedByDriver}
                  onChange={(e) => setAcknowledgedByDriver(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">Confirmo que validé la entrega físicamente</div>
                  <div className="text-xs text-slate-500">Incluye revisión del receptor y evidencia fotográfica antes del cierre.</div>
                </div>
              </label>

              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700 font-medium">{error}</div>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                Confirmar Entrega con Evidencia
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PodModal;
