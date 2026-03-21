import { Driver, Order, Route } from '../../src/types.js';

export const createInitialOrders = (): Order[] => [
  { id: '4021', status: 'Entregado', time: 'Hace 2 min', client: 'Juan Pérez', address: 'Av. Larco 123, Miraflores', color: 'bg-emerald-100 text-emerald-700', items: 3, value: 150.50, driverId: 'D1', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1221, lng: -77.0298 },
  { id: '4022', status: 'En Ruta', time: 'Hace 15 min', client: 'María García', address: 'Calle Las Flores 456, San Isidro', color: 'bg-blue-100 text-blue-700', items: 1, value: 45.00, driverId: 'D1', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.0945, lng: -77.0356 },
  { id: '4023', status: 'Retrasado', time: 'Hace 1 hr', client: 'Carlos Torres', address: 'Jr. Puno 789, Cercado', color: 'bg-red-100 text-red-700', items: 5, value: 320.00, driverId: 'D3', carrier: 'Urbano', carrierLogo: 'UR', lat: -12.0464, lng: -77.0297 },
  { id: '4024', status: 'Pendiente', time: 'Hace 2 hr', client: 'Ana Loli', address: 'Av. Universitaria 101, SMP', color: 'bg-slate-100 text-slate-700', items: 2, value: 89.90, lat: -11.9912, lng: -77.0823 },
  { id: '4025', status: 'Pendiente', time: 'Hace 3 hr', client: 'Roberto Díaz', address: 'Av. Javier Prado 1500, San Borja', color: 'bg-slate-100 text-slate-700', items: 4, value: 210.00, lat: -12.0854, lng: -77.0012 },
  { id: '4026', status: 'En Ruta', time: 'Hace 30 min', client: 'Elena Paz', address: 'Av. Arequipa 2400, Lince', color: 'bg-blue-100 text-blue-700', items: 2, value: 120.00, driverId: 'D2', carrier: 'Marvi', carrierLogo: 'MV', lat: -12.0823, lng: -77.0345 },
];

export const createInitialDrivers = (): Driver[] => [
  { id: 'D1', name: 'Carlos Mendoza', status: 'En Ruta', orders: 5, efficiency: 98, avatar: 'CM', vehicle: 'Camioneta NHR', phone: '987654321', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1000, lng: -77.0300 },
  { id: 'D2', name: 'Luis Paredes', status: 'En Ruta', orders: 3, efficiency: 95, avatar: 'LP', vehicle: 'Moto Cargo', phone: '912345678', carrier: 'Marvi', carrierLogo: 'MV', lat: -12.0800, lng: -77.0350 },
  { id: 'D3', name: 'Jorge Ruiz', status: 'En Ruta', orders: 3, efficiency: 92, avatar: 'JR', vehicle: 'Furgón H100', phone: '955443322', carrier: 'Urbano', carrierLogo: 'UR', lat: -12.0500, lng: -77.0300 },
  { id: 'D4', name: 'Ana Belén', status: 'Disponible', orders: 0, efficiency: 99, avatar: 'AB', vehicle: 'Camioneta NHR', phone: '944332211', carrier: 'Shalom', carrierLogo: 'SH', lat: -12.1200, lng: -77.0200 },
];

export const createInitialRoutes = (): Route[] => [
  { id: 'R1', driverId: 'D1', stops: ['4021', '4022'], status: 'Activa', progress: 50 },
  { id: 'R2', driverId: 'D2', stops: ['4026'], status: 'Activa', progress: 30 },
  { id: 'R3', driverId: 'D3', stops: ['4023'], status: 'Activa', progress: 10 },
];
