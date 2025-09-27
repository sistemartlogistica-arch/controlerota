/**
 * Sistema de Cache Local para Registros
 * 
 * Este módulo implementa um cache inteligente que:
 * - Armazena todos os registros localmente
 * - Tem TTL de 1 semana
 * - Faz delta updates dos últimos 50 registros
 * - Evita leituras desnecessárias do Firestore
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  lastUpdate: number; // Timestamp da última atualização
  version: number; // Versão do cache para controle
}

interface RecordsCacheData {
  records: any[];
  totalCount: number;
  lastRecordTimestamp?: string; // Timestamp do registro mais recente
  cacheVersion: number;
}

class RecordsCacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly CACHE_KEY = 'registros_cache';
  private readonly TTL_WEEK = 7 * 24 * 60 * 60 * 1000; // 1 semana em ms
  private readonly TTL_DAY = 24 * 60 * 60 * 1000; // 1 dia em ms
  private readonly DELTA_LIMIT = 50; // Máximo de registros para delta update

  constructor() {
    // Inicializar cache do localStorage se disponível
    this.loadFromLocalStorage();
    
    // Limpeza automática a cada hora
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  /**
   * Carrega cache do localStorage (apenas no browser)
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache.set(this.CACHE_KEY, parsed);
        console.info('📦 Cache carregado do localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar cache do localStorage:', error);
    }
  }

  /**
   * Salva cache no localStorage (apenas no browser)
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = this.cache.get(this.CACHE_KEY);
      if (cacheData) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
        console.info('💾 Cache salvo no localStorage');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao salvar cache no localStorage:', error);
    }
  }

  /**
   * Verifica se o cache é válido (dentro do TTL)
   */
  isCacheValid(): boolean {
    const cacheItem = this.cache.get(this.CACHE_KEY);
    if (!cacheItem) return false;

    const now = Date.now();
    const isValid = (now - cacheItem.timestamp) < cacheItem.ttl;
    
    if (!isValid) {
      console.info('⏰ Cache expirado, será necessário full load');
    }
    
    return isValid;
  }

  /**
   * Obtém dados do cache se válido
   */
  getCacheData(): RecordsCacheData | null {
    const cacheItem = this.cache.get(this.CACHE_KEY);
    if (!cacheItem || !this.isCacheValid()) {
      return null;
    }

    console.info('✅ Cache válido encontrado, usando dados locais');
    return cacheItem.data;
  }

  /**
   * Define dados no cache (full load)
   */
  setCacheData(records: any[], totalCount: number): void {
    const now = Date.now();
    const lastRecordTimestamp = records.length > 0 
      ? records[0].abertura?.dataHora 
      : undefined;

    const cacheData: RecordsCacheData = {
      records: [...records], // Cópia para evitar mutação
      totalCount,
      lastRecordTimestamp,
      cacheVersion: now
    };

    const cacheItem: CacheItem<RecordsCacheData> = {
      data: cacheData,
      timestamp: now,
      ttl: this.TTL_WEEK, // 1 semana
      lastUpdate: now,
      version: 1
    };

    this.cache.set(this.CACHE_KEY, cacheItem);
    this.saveToLocalStorage();
    
    console.info(`🔄 Full load realizado: ${records.length} registros carregados`);
  }

  /**
   * Atualiza cache com delta (últimos registros)
   */
  updateCacheWithDelta(newRecords: any[]): void {
    const cacheItem = this.cache.get(this.CACHE_KEY);
    if (!cacheItem) {
      console.warn('⚠️ Tentativa de delta update sem cache existente');
      return;
    }

    const cacheData = cacheItem.data as RecordsCacheData;
    const existingRecords = cacheData.records;
    
    // Filtrar registros que já existem no cache
    const existingIds = new Set(existingRecords.map(r => r.id));
    const trulyNewRecords = newRecords.filter(r => !existingIds.has(r.id));
    
    if (trulyNewRecords.length === 0) {
      console.info('ℹ️ Delta update: Nenhum registro novo encontrado');
      return;
    }

    // Adicionar novos registros no início (mais recentes primeiro)
    const updatedRecords = [...trulyNewRecords, ...existingRecords];
    
    // Manter apenas os registros mais recentes se exceder limite
    const maxRecords = 10000; // Limite para evitar cache muito grande
    const finalRecords = updatedRecords.slice(0, maxRecords);

    // Atualizar timestamp do último registro
    const lastRecordTimestamp = finalRecords.length > 0 
      ? finalRecords[0].abertura?.dataHora 
      : cacheData.lastRecordTimestamp;

    const updatedCacheData: RecordsCacheData = {
      records: finalRecords,
      totalCount: cacheData.totalCount + trulyNewRecords.length,
      lastRecordTimestamp,
      cacheVersion: Date.now()
    };

    // Atualizar cache
    cacheItem.data = updatedCacheData;
    cacheItem.lastUpdate = Date.now();
    cacheItem.version += 1;

    this.cache.set(this.CACHE_KEY, cacheItem);
    this.saveToLocalStorage();
    
    console.info(`🔄 Delta update realizado: ${trulyNewRecords.length} novos registros adicionados`);
  }

  /**
   * Obtém timestamp do último registro no cache
   */
  getLastRecordTimestamp(): string | undefined {
    const cacheData = this.getCacheData();
    return cacheData?.lastRecordTimestamp;
  }

  /**
   * Limpa cache expirado
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.info(`🧹 Limpeza de cache: ${keysToDelete.length} itens removidos`);
    }
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
    console.info('🗑️ Cache completamente limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    hasCache: boolean;
    isValid: boolean;
    recordCount: number;
    lastUpdate: string;
    age: string;
  } {
    const cacheItem = this.cache.get(this.CACHE_KEY);
    const now = Date.now();

    if (!cacheItem) {
      return {
        hasCache: false,
        isValid: false,
        recordCount: 0,
        lastUpdate: 'Nunca',
        age: 'N/A'
      };
    }

    const ageMs = now - cacheItem.timestamp;
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageDays = Math.floor(ageHours / 24);

    return {
      hasCache: true,
      isValid: this.isCacheValid(),
      recordCount: cacheItem.data.records?.length || 0,
      lastUpdate: new Date(cacheItem.lastUpdate).toLocaleString('pt-BR'),
      age: ageDays > 0 ? `${ageDays} dias` : `${ageHours} horas`
    };
  }
}

// Instância singleton
export const recordsCache = new RecordsCacheManager();

// Exportar tipos para uso externo
export type { RecordsCacheData };
