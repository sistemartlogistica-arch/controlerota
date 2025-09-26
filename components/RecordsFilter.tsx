import React, { useState, useEffect } from 'react';
import { FilterOptions } from '../lib/hooks/useRecordsFilter';

interface RecordsFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  users?: Array<{ uid: string; nome: string }>;
  vans?: Array<{ id: string; placa: string }>;
  loading?: boolean;
}

export default function RecordsFilter({
  filters,
  onFiltersChange,
  onClearFilters,
  users = [],
  vans = [],
  loading = false
}: RecordsFilterProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = {
      ...localFilters,
      [key]: value === '' ? undefined : value
    };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
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
          🔍 Filtros de Registros
        </h3>
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              border: '1px solid #6c757d',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            {showAdvanced ? 'Filtros Simples' : 'Filtros Avançados'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                padding: '8px 16px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer'
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
            value={localFilters.status || 'todos'}
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
            value={localFilters.userId || ''}
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
            value={localFilters.vanId || ''}
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
            value={localFilters.userTipo || ''}
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
      </div>

      {/* Filtros Avançados */}
      {showAdvanced && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
          {/* Filtro de Data Início */}
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Data Início:
            </label>
            <input
              type="date"
              value={localFilters.dataInicio || ''}
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
              value={localFilters.dataFim || ''}
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
      )}

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleApplyFilters}
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
          {loading ? 'Aplicando...' : 'Aplicar Filtros'}
        </button>

        <button
          onClick={() => setLocalFilters(filters)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancelar
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
