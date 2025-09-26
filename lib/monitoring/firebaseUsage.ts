// Sistema de monitoramento do uso do Firebase
import { useState, useEffect } from 'react';

interface FirebaseUsageStats {
  reads: number;
  writes: number;
  deletes: number;
  lastReset: Date;
}

class FirebaseUsageMonitor {
  private stats: FirebaseUsageStats = {
    reads: 0,
    writes: 0,
    deletes: 0,
    lastReset: new Date()
  };

  private dailyLimit = 50000; // Limite diário de leituras
  private warningThreshold = 0.8; // 80% do limite

  incrementReads(count: number = 1): void {
    this.stats.reads += count;
    this.checkLimits();
  }

  incrementWrites(count: number = 1): void {
    this.stats.writes += count;
  }

  incrementDeletes(count: number = 1): void {
    this.stats.deletes += count;
  }

  getStats(): FirebaseUsageStats {
    return { ...this.stats };
  }

  getReadsToday(): number {
    return this.stats.reads;
  }

  getReadsRemaining(): number {
    return Math.max(0, this.dailyLimit - this.stats.reads);
  }

  getUsagePercentage(): number {
    return (this.stats.reads / this.dailyLimit) * 100;
  }

  private checkLimits(): void {
    const usagePercentage = this.getUsagePercentage();
    
    if (usagePercentage >= 100) {
      console.error('🚨 LIMITE DIÁRIO DE LEITURAS EXCEDIDO!');
      this.showAlert('Limite diário de leituras do Firebase excedido!');
    } else if (usagePercentage >= this.warningThreshold * 100) {
      console.warn('⚠️ Aproximando-se do limite diário de leituras');
      this.showAlert(`Atenção: ${usagePercentage.toFixed(1)}% do limite diário usado`);
    }
  }

  private showAlert(message: string): void {
    // Em produção, você pode integrar com um sistema de notificações
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }

  resetDailyStats(): void {
    this.stats = {
      reads: 0,
      writes: 0,
      deletes: 0,
      lastReset: new Date()
    };
  }

  // Verificar se é um novo dia
  isNewDay(): boolean {
    const now = new Date();
    const lastReset = this.stats.lastReset;
    
    return now.getDate() !== lastReset.getDate() ||
           now.getMonth() !== lastReset.getMonth() ||
           now.getFullYear() !== lastReset.getFullYear();
  }

  // Auto-reset no novo dia
  checkAndResetIfNewDay(): void {
    if (this.isNewDay()) {
      this.resetDailyStats();
    }
  }
}

export const firebaseUsage = new FirebaseUsageMonitor();

// Auto-reset diário (apenas no cliente)
if (typeof window !== 'undefined') {
  setInterval(() => {
    firebaseUsage.checkAndResetIfNewDay();
  }, 60000); // Verificar a cada minuto
}

// Hook para monitorar uso em componentes React
export function useFirebaseUsage() {
  const [stats, setStats] = useState(firebaseUsage.getStats());
  const [usagePercentage, setUsagePercentage] = useState(firebaseUsage.getUsagePercentage());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(firebaseUsage.getStats());
      setUsagePercentage(firebaseUsage.getUsagePercentage());
    }, 10000); // Atualizar a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    usagePercentage,
    readsRemaining: firebaseUsage.getReadsRemaining(),
    isNearLimit: usagePercentage >= firebaseUsage['warningThreshold'] * 100
  };
}
