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

// Cache para usuários ativos
export const activeUsersCache: { [key: string]: { data: string[]; time: number } } = {};
export const ACTIVE_USERS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Função para buscar usuários ativos de forma eficiente
export const getActiveUserIds = async (db: any): Promise<string[]> => {
  const cacheKey = 'active_users';
  const now = Date.now();
  
  // Verificar cache
  if (activeUsersCache[cacheKey] && (now - activeUsersCache[cacheKey].time) < ACTIVE_USERS_CACHE_DURATION) {
    return activeUsersCache[cacheKey].data;
  }
  
  // Buscar usuários ativos
  const activeUsersSnapshot = await db.collection('usuarios')
    .where('ativo', '==', true)
    .get();
  const activeUserIds = activeUsersSnapshot.docs.map((doc: any) => doc.id);
  
  // Buscar usuários sem campo 'ativo' (considerados ativos por padrão)
  const allUsersSnapshot = await db.collection('usuarios').get();
  const usersWithoutActiveField = allUsersSnapshot.docs
    .filter((doc: any) => !doc.data().hasOwnProperty('ativo'))
    .map((doc: any) => doc.id);
  
  const allActiveUserIds = [...activeUserIds, ...usersWithoutActiveField];
  
  // Atualizar cache
  activeUsersCache[cacheKey] = { data: allActiveUserIds, time: now };
  
  return allActiveUserIds;
};

// Função para limpar cache de usuários ativos
export const clearActiveUsersCache = () => {
  Object.keys(activeUsersCache).forEach(key => delete activeUsersCache[key]);
  console.log('Cache de usuários ativos limpo');
};

// Função para limpar todos os caches
export const clearAllCaches = () => {
  clearRecordsCache();
  clearVansCache();
  clearRotasCache();
  clearActiveUsersCache();
  console.log('Todos os caches limpos');
};
