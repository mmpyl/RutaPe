import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, User, Package, DollarSign } from 'lucide-react';
import { Order } from '../../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Partial<Order>) => void;
}

interface FormErrors {
  client?: string;
  address?: string;
  items?: string;
  value?: string;
}

const CARRIERS: { name: string; logo: string }[] = [
  { name: 'Flota Propia', logo: 'FP' },
  { name: 'Shalom', logo: 'SH' },
  { name: 'Urbano', logo: 'UR' },
  { name: 'Marvi', logo: 'MV' },
];

const validate = (order: Partial<Order>): FormErrors => {
  const errors: FormErrors = {};
  if (!order.client?.trim()) errors.client = 'El nombre del cliente es obligatorio';
  if (!order.address?.trim()) errors.address = 'La dirección de entrega es obligatoria';
  if (!order.items || order.items <= 0) errors.items = 'Debe haber al menos 1 ítem';
  if (order.value === undefined || order.value < 0) errors.value = 'El valor no puede ser negativo';
  return errors;
};

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="text-xs text-red-500 font-medium mt-1 ml-1">{message}</p> : null;

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [order, setOrder] = useState<Partial<Order>>({
    client: '',
    address: '',
    items: 1,
    value: 0,
    status: 'Pendiente',
    time: 'Ahora',
    color: 'bg-slate-100 text-slate-700',
    carrier: 'Flota Propia',
    carrierLogo: 'FP',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof Partial<Order>, value: unknown) => {
    const updated = { ...order, [field]: value };
    setOrder(updated);
    // Revalidar en tiempo real solo si ya intentó enviar
    if (submitted) setErrors(validate(updated));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const fieldErrors = validate(order);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    onSubmit(order);
    // Resetear estado tras envío exitoso
    setOrder({
      client: '', address: '', items: 1, value: 0,
      status: 'Pendiente', time: 'Ahora',
      color: 'bg-slate-100 text-slate-700',
      carrier: 'Flota Propia', carrierLogo: 'FP',
    });
    setErrors({});
    setSubmitted(false);
  };

  const handleClose = () => {
    setErrors({});
    setSubmitted(false);
    onClose();
  };

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
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Nuevo Despacho</h3>
              <button onClick={handleClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Carrier selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Carrier / Operador
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CARRIERS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleChange('carrier', c.name)}
                      className={`py-3 rounded-xl text-[10px] font-bold transition-all border-2 ${
                        order.carrier === c.name
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Cliente
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors ${
                      errors.client ? 'border-red-300 bg-red-50' : 'border-transparent'
                    }`}
                    value={order.client}
                    onChange={(e) => handleChange('client', e.target.value)}
                  />
                </div>
                <FieldError message={errors.client} />
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Dirección de Entrega
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    type="text"
                    placeholder="Ej: Av. Larco 123, Miraflores"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors ${
                      errors.address ? 'border-red-300 bg-red-50' : 'border-transparent'
                    }`}
                    value={order.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
                <FieldError message={errors.address} />
              </div>

              {/* Items + Valor */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Items
                  </label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="number"
                      min={1}
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors ${
                        errors.items ? 'border-red-300 bg-red-50' : 'border-transparent'
                      }`}
                      value={order.items}
                      onChange={(e) => handleChange('items', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <FieldError message={errors.items} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Valor (S/)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-colors ${
                        errors.value ? 'border-red-300 bg-red-50' : 'border-transparent'
                      }`}
                      value={order.value}
                      onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                    />
                  </div>
                  <FieldError message={errors.value} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all mt-4"
              >
                Crear Despacho
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewOrderModal;
