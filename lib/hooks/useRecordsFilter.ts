import { useState, useEffect, useCallback } from 'react';
import { cache, CACHE_KEYS } from '../cache';

export interface FilterOptions {
  userId?: string;
  vanId?: string;
  userTipo?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: 'aberto' | 'fechado' | 'todos';
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FilteredRecordsResult {
  records: any[];
  pagination: PaginationInfo;
  filters: FilterOptions;
  loading: boolean;
  error: string | null;
}

export function useRecordsFilter(initialFilters: FilterOptions = {}) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [records, setRecords] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gerar chave de cache baseada nos filtros
  const getCacheKey = useCallback((page: number) => {
    return `filtered_records_${JSON.stringify(filters)}_${page}`;
  }, [filters]);

  // Buscar registros com filtros
  const fetchRecords = useCallback(async (page: number = 1, useCache: boolean = true) => {
    const cacheKey = getCacheKey(page);
    
    // Verificar cache primeiro
    if (useCache) {
      const cachedData = cache.get<{records: any[], pagination: PaginationInfo}>(cacheKey);
      if (cachedData) {
        setRecords(cachedData.records);
        setPagination(cachedData.pagination);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`/api/records/filter?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar registros');
      }

      const data = await response.json();
      
      setRecords(data.records);
      setPagination(data.pagination);
      
      // Cache por 2 minutos
      cache.setDynamic(cacheKey, data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize, getCacheKey]);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Limpar cache relacionado
    cache.clear('filtered_records_');
    
    // Resetar para primeira página
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
    cache.clear('filtered_records_');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Mudar página
  const changePage = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Atualizar dados
  const refresh = useCallback(() => {
    cache.clear('filtered_records_');
    fetchRecords(pagination.page, false);
  }, [fetchRecords, pagination.page]);

  // Buscar automaticamente quando filtros ou página mudam
  useEffect(() => {
    fetchRecords(pagination.page);
  }, [fetchRecords, pagination.page]);

  return {
    records,
    pagination,
    filters,
    loading,
    error,
    applyFilters,
    clearFilters,
    changePage,
    refresh,
    fetchRecords
  };
}

// Hook específico para contagem rápida (sem carregar registros)
export function useRecordsCount(filters: FilterOptions = {}) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    const cacheKey = `count_${JSON.stringify(filters)}`;
    
    // Verificar cache
    const cachedCount = cache.get<number>(cacheKey);
    if (cachedCount !== null) {
      setCount(cachedCount);
      return;
    }

    setLoading(true);
    
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      );

      const response = await fetch(`/api/records/filter?${params}&pageSize=1`);
      const data = await response.json();
      
      setCount(data.pagination.total);
      
      // Cache por 5 minutos
      cache.setDynamic(cacheKey, data.pagination.total);
      
    } catch (error) {
      console.error('Erro ao buscar contagem:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refresh: fetchCount };
}
