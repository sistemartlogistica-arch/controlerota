import React, { useState } from 'react';
import { SearchFilters } from '../lib/hooks/useRecordsSearch';

interface RecordsSearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
  users?: Array<{ uid: string; nome: string }>;
  vans?: Array<{ id: string; placa: string }>;
}

export default function RecordsSearchForm({
  onSearch,
  onClear,
  loading = false,
  users = [],
  vans = []
}: RecordsSearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#495057' }}>
          🔍 Buscar Registros
        </h3>
        <div>
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              style={{
                padding: '8px 16px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
        {/* Filtro de Status */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Status:
          </label>
          <select
            value={filters.status || 'todos'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          >
            <option value="todos">Todos</option>
            <option value="aberto">Abertos</option>
            <option value="fechado">Fechados</option>
          </select>
        </div>

        {/* Filtro de Usuário */}
        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Usuário:
          </label>
          <select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          >
            <option value="">Todos os usuários</option>
            {users.map(user => (
              <option key={user.uid} value={user.uid}>
                {user.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Van */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Van:
          </label>
          <select
            value={filters.vanId || ''}
            onChange={(e) => handleFilterChange('vanId', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          >
            <option value="">Todas as vans</option>
            {vans.map(van => (
              <option key={van.id} value={van.id}>
                {van.placa}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Tipo de Usuário */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Tipo:
          </label>
          <select
            value={filters.userTipo || ''}
            onChange={(e) => handleFilterChange('userTipo', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          >
            <option value="">Todos os tipos</option>
            <option value="motorista">Motorista</option>
            <option value="copiloto">Copiloto</option>
          </select>
        </div>

        {/* Filtro de Data Início */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Data Início:
          </label>
          <input
            type="date"
            value={filters.dataInicio || ''}
            onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Filtro de Data Fim */}
        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Data Fim:
          </label>
          <input
            type="date"
            value={filters.dataFim || ''}
            onChange={(e) => handleFilterChange('dataFim', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Botão de Busca */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Buscando...' : '🔍 Buscar Registros'}
        </button>
      </div>

      {/* Indicador de Filtros Ativos */}
      {hasActiveFilters && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Filtros ativos:</strong>{' '}
          {Object.entries(filters)
            .filter(([_, value]) => value !== undefined && value !== '')
            .map(([key, value]) => {
              const labels: Record<string, string> = {
                userId: 'Usuário',
                vanId: 'Van',
                userTipo: 'Tipo',
                dataInicio: 'Data Início',
                dataFim: 'Data Fim',
                status: 'Status'
              };
              return `${labels[key]}: ${value}`;
            })
            .join(', ')}
        </div>
      )}
    </div>
  );
}
