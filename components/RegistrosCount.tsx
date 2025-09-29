import React, { useState, useEffect } from 'react';

interface RegistrosCountProps {
  className?: string;
}

/**
 * Componente para exibir o número total de registros
 */
export default function RegistrosCount({ className = '' }: RegistrosCountProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/registros/count');
        const data = await response.json();
        
        if (response.ok) {
          setCount(data.count);
        } else {
          setError(data.error || 'Erro ao carregar contagem');
        }
      } catch (err) {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading) {
    return (
      <div className={`registros-count ${className}`}>
        <span>Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`registros-count error ${className}`}>
        <span>Erro: {error}</span>
      </div>
    );
  }

  return (
    <div className={`registros-count ${className}`}>
      <span>{count?.toLocaleString()}</span>
    </div>
  );
}
