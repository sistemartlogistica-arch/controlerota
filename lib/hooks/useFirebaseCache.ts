import { useState, useEffect, useCallback } from 'react';
import { cache, CACHE_KEYS } from '../cache';

interface UseFirebaseCacheOptions {
  cacheKey: string;
  ttlMinutes?: number;
  enabled?: boolean;
}

export function useFirebaseCache<T>(
  fetchFn: () => Promise<T>,
  options: UseFirebaseCacheOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { cacheKey, ttlMinutes = 5, enabled = true } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Verificar cache primeiro
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      
      // Armazenar no cache
      if (ttlMinutes > 0) {
        cache.set(cacheKey, result, ttlMinutes);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, ttlMinutes, enabled]);

  const refetch = useCallback(() => {
    cache.clear(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Hook específico para dados que mudam pouco (rotas, vans)
export function useStaticData<T>(fetchFn: () => Promise<T>, cacheKey: string) {
  return useFirebaseCache(fetchFn, {
    cacheKey,
    ttlMinutes: 60, // 1 hora
    enabled: true
  });
}

// Hook específico para dados dinâmicos (registros, usuários)
export function useDynamicData<T>(fetchFn: () => Promise<T>, cacheKey: string) {
  return useFirebaseCache(fetchFn, {
    cacheKey,
    ttlMinutes: 2, // 2 minutos
    enabled: true
  });
}
