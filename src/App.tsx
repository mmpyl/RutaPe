import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff } from 'lucide-react';
import { useApi } from './hooks/useApi';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Routes from './components/Routes';
import Drivers from './components/Drivers';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import NewOrderModal from './components/Modals/NewOrderModal';
import PodModal from './components/Modals/PodModal';
import { BulkImportedOrder, Order, PodProof } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'plan' | 'demo'>('plan');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [podModal, setPodModal] = useState<{ isOpen: boolean; orderId: string | null }>({
    isOpen: false,
    orderId: null,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const {
    orders,
    drivers,
    routes,
    loading,
    error,
    addOrder,
    updateOrder,
    sendAlert,
    optimizeRoutes,
  } = useApi();

  useEffect(() => {
    document.body.style.overflow = view === 'demo' ? 'hidden' : 'auto';
  }, [view]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3000);
  };

  const handleAddOrder = async (orderData: Partial<Order>) => {
    try {
      await addOrder(orderData);
      setIsNewOrderModalOpen(false);
      showToast('Pedido creado exitosamente');
    } catch {
      showToast('Error al crear el pedido', 'error');
    }
  };

  const handleBulkImport = async (newOrders: BulkImportedOrder[]) => {
    try {
      for (const order of newOrders) {
        await addOrder({
          ...order,
          status: 'Pendiente',
          time: 'Ahora',
          color: 'bg-slate-100 text-slate-700',
        });
      }
      showToast(`${newOrders.length} pedidos importados con éxito`);
    } catch {
      showToast('Error en la importación masiva', 'error');
    }
  };

  const handleSendAlert = async (id: string) => {
    try {
      await sendAlert(id);
      showToast('Alerta de WhatsApp enviada');
    } catch {
      showToast('Error al enviar alerta', 'error');
    }
  };

  const handlePodSubmit = async (data: PodProof) => {
    if (podModal.orderId) {
      try {
        await updateOrder(podModal.orderId, {
          status: 'Entregado',
          color: 'bg-emerald-100 text-emerald-700',
          time: 'Ahora',
          pod: data,
        });
        setPodModal({ isOpen: false, orderId: null });
        showToast(`Entrega confirmada con evidencia para ${data.recipientName}`);
      } catch {
        showToast('Error al confirmar entrega', 'error');
      }
    }
  };

  const renderContent = () => {
    if (loading && orders.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            orders={orders}
            drivers={drivers}
            onNewOrder={() => setIsNewOrderModalOpen(true)}
            onViewAllOrders={() => setActiveTab('pedidos')}
            onViewRoutes={() => setActiveTab('rutas')}
          />
        );
      case 'pedidos':
        return (
          <Orders
            orders={orders}
            onNewOrder={() => setIsNewOrderModalOpen(true)}
            onSendAlert={handleSendAlert}
            onViewDetail={(id) => {
              const order = orders.find((currentOrder) => currentOrder.id === id);
              if (order?.status === 'En Ruta') {
                setPodModal({ isOpen: true, orderId: id });
              } else {
                showToast(`Viendo detalle del pedido #${id}`);
              }
            }}
            onDelete={(id) => showToast(`Pedido #${id} eliminado (simulación)`)}
            onBulkImport={handleBulkImport}
            onTrackOrder={(id) => {
              setTrackedOrderId(id);
              setIsMapVisible(true);
              setActiveTab('rutas');
            }}
          />
        );
      case 'rutas':
        return (
          <Routes
            routes={routes}
            drivers={drivers}
            orders={orders}
            trackedOrderId={trackedOrderId}
            setTrackedOrderId={setTrackedOrderId}
            isMapVisible={isMapVisible}
            setIsMapVisible={setIsMapVisible}
            onOptimize={optimizeRoutes}
          />
        );
      case 'repartidores':
        return <Drivers drivers={drivers} />;
      case 'configuracion':
        return <Settings />;
      default:
        return null;
    }
  };

  if (view === 'plan') {
    return <LandingPage onEnterApp={() => setView('demo')} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onBackToPlan={() => setView('plan')} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <NewOrderModal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} onSubmit={handleAddOrder} />

      <PodModal
        isOpen={podModal.isOpen}
        orderId={podModal.orderId}
        onClose={() => setPodModal({ isOpen: false, orderId: null })}
        onSubmit={handlePodSubmit}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-[2000] flex items-center gap-3 font-bold text-sm ${
              toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                toast.type === 'success' ? 'bg-emerald-500' : 'bg-white'
              }`}
            />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed top-8 right-8 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-[2000] max-w-md">
          <div className="font-bold text-sm mb-1">Error de conexión</div>
          <div className="text-xs text-red-100">{error}</div>
        </div>
      )}
    </div>
  );
};

export default App;
