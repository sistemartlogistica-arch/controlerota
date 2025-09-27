/**
 * Hook para Gerenciar Registros com Cache Inteligente
 * 
 * Este hook implementa a lógica de cache conforme especificado:
 * - Cache local com TTL de 1 semana
 * - Full load quando cache expirado
 * - Delta updates dos últimos 50 registros
 * - Logs detalhados de operações
 */

import { useState, useEffect, useCallback } from 'react';
import { recordsCache, RecordsCacheData } from '../cache/recordsCache';
import { getAllRecords } from '../firestore';

interface UseRecordsWithCacheReturn {
  records: any[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refreshRecords: () => Promise<void>;
  loadRecords: () => void; // Nova função para carregar registros sob demanda
  cacheStats: {
    hasCache: boolean;
    isValid: boolean;
    recordCount: number;
    lastUpdate: string;
    age: string;
  };
}

export function useRecordsWithCache(): UseRecordsWithCacheReturn {
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega dados do cache se válido, senão faz full load
   */
  const loadFromCacheOrFullLoad = useCallback(async (): Promise<void> => {
    console.info('🔄 Iniciando carregamento de registros...');
    
    // Verificar se cache é válido
    const cacheData = recordsCache.getCacheData();
    
    if (cacheData) {
      // Cache válido - usar dados locais
      console.info('✅ Usando cache válido');
      setRecords(cacheData.records);
      setTotalCount(cacheData.totalCount);
      setLoading(false);
      setError(null);
      
      // Fazer delta update em background
      performDeltaUpdate();
    } else {
      // Cache inválido ou não existe - fazer full load
      console.info('🔄 Cache inválido, iniciando full load...');
      await performFullLoad();
    }
  }, []);

  /**
   * Executa full load do Firestore
   */
  const performFullLoad = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.info('📡 Executando full load do Firestore...');
      const startTime = Date.now();
      
      // Carregar todos os registros do Firestore
      const allRecords = await getAllRecords();
      
      const loadTime = Date.now() - startTime;
      console.info(`✅ Full load concluído: ${allRecords.length} registros em ${loadTime}ms`);
      
      // Salvar no cache
      recordsCache.setCacheData(allRecords, allRecords.length);
      
      // Atualizar estado
      setRecords(allRecords);
      setTotalCount(allRecords.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro no full load:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Executa delta update (últimos 50 registros)
   */
  const performDeltaUpdate = useCallback(async (): Promise<void> => {
    try {
      const lastTimestamp = recordsCache.getLastRecordTimestamp();
      
      if (!lastTimestamp) {
        console.info('ℹ️ Delta update: Nenhum timestamp anterior encontrado');
        return;
      }

      console.info('🔄 Executando delta update...');
      const startTime = Date.now();
      
      // Buscar registros mais recentes que o último no cache
      const recentRecords = await getAllRecords(50, lastTimestamp);
      
      const updateTime = Date.now() - startTime;
      console.info(`✅ Delta update concluído: ${recentRecords.length} registros em ${updateTime}ms`);
      
      if (recentRecords.length > 0) {
        // Atualizar cache com novos registros
        recordsCache.updateCacheWithDelta(recentRecords);
        
        // Atualizar estado com dados do cache
        const updatedCacheData = recordsCache.getCacheData();
        if (updatedCacheData) {
          setRecords(updatedCacheData.records);
          setTotalCount(updatedCacheData.totalCount);
        }
      }
      
    } catch (err) {
      console.warn('⚠️ Erro no delta update:', err);
      // Não definir erro aqui para não quebrar a UI
      // O delta update é opcional
    }
  }, []);

  /**
   * Força refresh completo (ignora cache)
   */
  const refreshRecords = useCallback(async (): Promise<void> => {
    console.info('🔄 Forçando refresh completo...');
    recordsCache.clearCache();
    await performFullLoad();
  }, [performFullLoad]);

  /**
   * Inicializar dados apenas quando necessário (lazy loading)
   */
  const initializeData = useCallback(() => {
    if (records.length === 0 && !loading) {
      loadFromCacheOrFullLoad();
    }
  }, [records.length, loading, loadFromCacheOrFullLoad]);

  /**
   * Função para carregar registros sob demanda
   */
  const loadRecords = useCallback(() => {
    initializeData();
  }, [initializeData]);

  /**
   * Não carregar automaticamente - apenas quando solicitado
   */
  // useEffect removido para evitar carregamento automático

  /**
   * Configurar delta updates periódicos
   */
  useEffect(() => {
    // Delta update a cada 5 minutos se cache for válido
    const interval = setInterval(() => {
      if (recordsCache.isCacheValid()) {
        performDeltaUpdate();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [performDeltaUpdate]);

  // Obter estatísticas do cache
  const cacheStats = recordsCache.getCacheStats();

  return {
    records,
    loading,
    error,
    totalCount,
    refreshRecords,
    loadRecords,
    cacheStats
  };
}
