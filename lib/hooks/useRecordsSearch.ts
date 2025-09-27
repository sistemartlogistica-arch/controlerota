import { useState, useCallback } from 'react';

export interface SearchFilters {
  userId?: string;
  vanId?: string;
  userTipo?: string;
  dataInicio?: string;
  dataFim?: string;
  status?: 'aberto' | 'fechado' | 'todos';
}

export interface SearchResult {
  records: any[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export function useRecordsSearch() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [records, setRecords] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Buscar contagem total
  const fetchTotalCount = useCallback(async (searchFilters: SearchFilters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value && value !== 'todos') {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/records/count?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar contagem');
      
      const data = await response.json();
      setTotalCount(data.count);
    } catch (err) {
      console.error('Erro ao buscar contagem:', err);
      setTotalCount(0);
    }
  }, []);

  // Buscar registros com filtros
  const searchRecords = useCallback(async (searchFilters: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Verificar se é busca sem filtros (todos os registros)
      const hasFilters = Object.values(searchFilters).some(value => value && value !== 'todos');
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: hasFilters ? '50' : '1000', // Mais registros por página quando sem filtros
        ...Object.fromEntries(
          Object.entries(searchFilters).filter(([_, value]) => value && value !== 'todos')
        )
      });

      const response = await fetch(`/api/records/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar registros');
      }

      const data: SearchResult = await response.json();
      
      setRecords(data.records);
      setCurrentPage(page);
      setFilters(searchFilters);
      setHasSearched(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: SearchFilters) => {
    searchRecords(newFilters, 1);
  }, [searchRecords]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
    setRecords([]);
    setHasSearched(false);
    setCurrentPage(1);
    setError(null);
  }, []);

  // Mudar página
  const changePage = useCallback((page: number) => {
    if (hasSearched) {
      searchRecords(filters, page);
    }
  }, [hasSearched, filters, searchRecords]);

  // Buscar contagem inicial
  const loadInitialCount = useCallback(() => {
    fetchTotalCount();
  }, [fetchTotalCount]);

  return {
    records,
    totalCount,
    filters,
    loading,
    error,
    currentPage,
    hasSearched,
    applyFilters,
    clearFilters,
    changePage,
    loadInitialCount,
    fetchTotalCount
  };
}
