export type OrderStatus = 'Pendiente' | 'En Ruta' | 'Entregado' | 'Retrasado' | 'Cancelado';

export interface Order {
  id: string;
  status: OrderStatus;
  time: string;
  client: string;
  address: string;
  color: string;
  driverId?: string;
  carrier?: string;
  carrierLogo?: string;
  items: number;
  value: number;
  lat?: number;
  lng?: number;
}

export interface Driver {
  id: string;
  name: string;
  status: 'Disponible' | 'En Ruta' | 'Descanso' | 'Fuera de Servicio';
  orders: number;
  efficiency: number;
  avatar: string;
  vehicle: string;
  phone: string;
  carrier?: string;
  carrierLogo?: string;
  lat?: number;
  lng?: number;
}

export interface Route {
  id: string;
  driverId: string;
  stops: string[];
  status: 'Activa' | 'Completada' | 'Programada';
  progress: number;
}
