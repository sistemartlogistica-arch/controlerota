// Sistema de cache compartilhado para invalidação entre APIs

export const recordsCache: { [key: string]: { data: any; time: number } } = {};
export const openRecordsCache: { [key: string]: { data: any; time: number } } = {};

export const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para registros
export const OPEN_CACHE_DURATION = 2 * 60 * 1000; // 2 minutos para registros abertos

// Função para limpar todos os caches de registros
export const clearRecordsCache = () => {
  Object.keys(recordsCache).forEach(key => delete recordsCache[key]);
  Object.keys(openRecordsCache).forEach(key => delete openRecordsCache[key]);
  console.log('Cache de registros limpo');
};

// Função para limpar cache de vans
export const clearVansCache = () => {
  if (typeof global !== 'undefined') {
    (global as any).vansCache = null;
    (global as any).vansCacheTime = 0;
  }
  console.log('Cache de vans limpo');
};

// Função para limpar cache de rotas
export const clearRotasCache = () => {
  if (typeof global !== 'undefined') {
    (global as any).rotasCache = null;
    (global as any).rotasCacheTime = 0;
  }
  console.log('Cache de rotas limpo');
};

// Função para limpar todos os caches
export const clearAllCaches = () => {
  clearRecordsCache();
  clearVansCache();
  clearRotasCache();
  console.log('Todos os caches limpos');
};
