import React from 'react';
import { PaginationInfo } from '../lib/hooks/useRecordsFilter';

interface RecordsPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function RecordsPagination({
  pagination,
  onPageChange,
  loading = false
}: RecordsPaginationProps) {
  const { page, totalPages, total, pageSize, hasMore } = pagination;

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre mostrar primeira página
      pages.push(1);
      
      if (page > 3) {
        pages.push('...');
      }
      
      // Páginas ao redor da página atual
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (page < totalPages - 2) {
        pages.push('...');
      }
      
      // Sempre mostrar última página
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      onPageChange(newPage);
    }
  };

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 0',
      borderTop: '1px solid #e9ecef',
      marginTop: '20px'
    }}>
      {/* Informações de registros */}
      <div style={{ color: '#6c757d', fontSize: '14px' }}>
        Mostrando {startRecord} a {endRecord} de {total.toLocaleString()} registros
      </div>

      {/* Controles de paginação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {/* Botão Anterior */}
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || loading}
          style={{
            padding: '8px 12px',
            border: '1px solid #ced4da',
            backgroundColor: page <= 1 || loading ? '#f8f9fa' : 'white',
            color: page <= 1 || loading ? '#6c757d' : '#495057',
            cursor: page <= 1 || loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          ← Anterior
        </button>

        {/* Números das páginas */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {getPageNumbers().map((pageNum, index) => (
            <button
              key={index}
              onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : undefined}
              disabled={pageNum === '...' || loading}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                backgroundColor: pageNum === page ? '#007bff' : 'white',
                color: pageNum === page ? 'white' : pageNum === '...' ? '#6c757d' : '#495057',
                cursor: pageNum === '...' || loading ? 'default' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '40px'
              }}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Botão Próximo */}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasMore || loading}
          style={{
            padding: '8px 12px',
            border: '1px solid #ced4da',
            backgroundColor: !hasMore || loading ? '#f8f9fa' : 'white',
            color: !hasMore || loading ? '#6c757d' : '#495057',
            cursor: !hasMore || loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          Próximo →
        </button>
      </div>

      {/* Seletor de itens por página */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', color: '#6c757d' }}>Itens por página:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            // Esta funcionalidade seria implementada no hook pai
            console.log('Mudar para', e.target.value, 'itens por página');
          }}
          disabled={loading}
          style={{
            padding: '4px 8px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
}
