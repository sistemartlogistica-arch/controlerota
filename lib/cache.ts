// Sistema de cache local para reduzir leituras do Firebase
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  accessCount: number; // Contador de acessos
}

class LocalCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // Limite máximo de itens no cache
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    // Se o cache estiver cheio, remover o item menos usado
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      accessCount: 0
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Incrementar contador de acessos
    item.accessCount++;
    return item.data;
  }

  clear(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      const keysToDelete: string[] = [];
      
      this.cache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // Cache específico para dados que mudam pouco
  setStatic<T>(key: string, data: T): void {
    this.set(key, data, 60); // 1 hora para dados estáticos
  }

  // Cache para dados que mudam frequentemente
  setDynamic<T>(key: string, data: T): void {
    this.set(key, data, 2); // 2 minutos para dados dinâmicos
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minAccessCount = Infinity;

    this.cache.forEach((item, key) => {
      if (item.accessCount < minAccessCount) {
        minAccessCount = item.accessCount;
        leastUsedKey = key;
      }
    });

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  // Método para limpar cache quando dados são atualizados
  invalidate(pattern: string): void {
    this.clear(pattern);
  }

  // Estatísticas do cache
  getStats() {
    const keys: string[] = [];
    this.cache.forEach((_, key) => keys.push(key));
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys
    };
  }
}

export const cache = new LocalCache();

// Chaves de cache padronizadas
export const CACHE_KEYS = {
  VANS: 'vans_list',
  ROTAS: 'rotas_list',
  USER_RECORDS: (userId: string) => `user_records_${userId}`,
  OPEN_RECORD: (userId: string) => `open_record_${userId}`,
  USER_DATA: (userId: string) => `user_data_${userId}`,
} as const;
