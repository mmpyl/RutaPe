export type DataMode = 'server' | 'browser';

export const getDataMode = (): DataMode =>
  import.meta.env.VITE_DATA_MODE === 'browser' ? 'browser' : 'server';

export const isBrowserDataMode = () => getDataMode() === 'browser';
