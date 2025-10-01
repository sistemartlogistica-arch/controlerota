import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Migration() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cutoffDate, setCutoffDate] = useState('2025-01-15');
  const router = useRouter();

  const analyzeRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migration/fix-timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', dryRun: true, beforeDate: cutoffDate })
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      alert('Erro ao analisar registros');
    } finally {
      setLoading(false);
    }
  };

  const fixRecords = async () => {
    if (!confirm('Tem certeza que deseja corrigir os registros? Esta ação não pode ser desfeita.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/migration/fix-timezone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix', dryRun: false, beforeDate: cutoffDate })
      });
      
      const data = await response.json();
      setResults(data);
      alert(`Migração concluída! ${data.fixedRecords} registros foram corrigidos.`);
    } catch (error) {
      alert('Erro ao corrigir registros');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Migração de Fuso Horário</h1>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3>⚠️ Problema Identificado</h3>
        <p>
          Registros criados antes da correção do fuso horário podem ter datas incorretas. 
          O sistema estava salvando horários em UTC em vez do fuso horário brasileiro (UTC-3), 
          causando uma diferença de 3 horas.
        </p>
        <p><strong>Exemplo:</strong> Registro marcado às 11h foi salvo como 8h (UTC).</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Data de Corte (Registros criados antes desta data serão analisados):
          </label>
          <input
            type="date"
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Registros criados antes desta data são considerados problemáticos
          </p>
        </div>
        
        <button 
          onClick={analyzeRecords}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Analisando...' : 'Analisar Registros'}
        </button>

        {results && results.recordsToFix > 0 && (
          <button 
            onClick={fixRecords}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Corrigindo...' : 'Corrigir Registros'}
          </button>
        )}
      </div>

      {results && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3>Resultados da Análise</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#495057' }}>{results.totalRecords}</div>
              <div>Total de Registros</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{results.recordsToFix}</div>
              <div>Precisam de Correção</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{results.fixedRecords}</div>
              <div>Já Corrigidos</div>
            </div>
          </div>

          {results.recordsToFix > 0 && (
            <div>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
              </button>

              {showDetails && (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Criado Em</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Abertura Original</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Abertura Corrigida</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Fechamento Original</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>Fechamento Corrigido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.records.map((record: any, index: number) => (
                        <tr key={record.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', fontFamily: 'monospace' }}>
                            {record.id.substring(0, 8)}...
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                            {record.createdAt ? new Date(record.createdAt).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                            {record.original.abertura ? new Date(record.original.abertura).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                            {record.fixed.abertura ? new Date(record.fixed.abertura).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                            {record.original.fechamento ? new Date(record.original.fechamento).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                            {record.fixed.fechamento ? new Date(record.fixed.fechamento).toLocaleString('pt-BR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          onClick={() => router.push('/admin')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Voltar ao Admin
        </button>
      </div>
    </div>
  );
}
