import React from 'react';
import { useFirebaseUsage } from '../lib/monitoring/firebaseUsage';

interface FirebaseUsageDashboardProps {
  show?: boolean;
}

export default function FirebaseUsageDashboard({ show = false }: FirebaseUsageDashboardProps) {
  const { stats, usagePercentage, readsRemaining, isNearLimit } = useFirebaseUsage();

  if (!show) return null;

  const getStatusColor = () => {
    if (usagePercentage >= 100) return '#ff4444';
    if (isNearLimit) return '#ffaa00';
    if (usagePercentage >= 50) return '#ffdd00';
    return '#44ff44';
  };

  const getStatusText = () => {
    if (usagePercentage >= 100) return 'CRÍTICO';
    if (isNearLimit) return 'ATENÇÃO';
    if (usagePercentage >= 50) return 'MODERADO';
    return 'NORMAL';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '250px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
        📊 Firebase Usage
      </h3>
      
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Leituras:</span>
          <span style={{ fontWeight: 'bold' }}>{stats.reads.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Escritas:</span>
          <span>{stats.writes.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Deleções:</span>
          <span>{stats.deletes.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Uso:</span>
          <span style={{ fontWeight: 'bold', color: getStatusColor() }}>
            {usagePercentage.toFixed(1)}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#eee',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(usagePercentage, 100)}%`,
            height: '100%',
            backgroundColor: getStatusColor(),
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Restantes:</span>
          <span style={{ color: readsRemaining < 1000 ? '#ff4444' : '#333' }}>
            {readsRemaining.toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{
        padding: '8px',
        backgroundColor: getStatusColor() === '#44ff44' ? '#e8f5e8' : 
                        getStatusColor() === '#ffdd00' ? '#fff8e1' :
                        getStatusColor() === '#ffaa00' ? '#fff3e0' : '#ffebee',
        borderRadius: '4px',
        textAlign: 'center',
        fontWeight: 'bold',
        color: getStatusColor()
      }}>
        {getStatusText()}
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
        Reset: {stats.lastReset.toLocaleTimeString()}
      </div>
    </div>
  );
}
