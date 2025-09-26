import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { firebaseUsage } from '../../../lib/monitoring/firebaseUsage';

// Cache para contagens
const countCache: { [key: string]: { count: number; time: number } } = {};
const COUNT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, vanId, userTipo, dataInicio, dataFim, status } = req.query;

  try {
    const db = admin.firestore();
    
    // Criar chave de cache baseada nos filtros
    const cacheKey = `count_${JSON.stringify({ userId, vanId, userTipo, dataInicio, dataFim, status })}`;
    const now = Date.now();
    
    // Verificar cache
    if (countCache[cacheKey] && (now - countCache[cacheKey].time) < COUNT_CACHE_DURATION) {
      return res.status(200).json({ 
        count: countCache[cacheKey].count,
        cached: true 
      });
    }

    // Construir query para contagem
    let query: any = db.collection('registros');
    
    // Aplicar filtros
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (vanId) {
      query = query.where('vanId', '==', vanId);
    }
    
    if (userTipo) {
      query = query.where('userTipo', '==', userTipo);
    }
    
    if (dataInicio) {
      const startDate = new Date(dataInicio as string);
      query = query.where('abertura.dataHora', '>=', startDate.toISOString());
    }
    
    if (dataFim) {
      const endDate = new Date(dataFim as string);
      endDate.setHours(23, 59, 59, 999);
      query = query.where('abertura.dataHora', '<=', endDate.toISOString());
    }
    
    if (status === 'aberto') {
      query = query.where('fechamento', '==', null);
    } else if (status === 'fechado') {
      query = query.where('fechamento', '!=', null);
    }
    
    // Executar query de contagem
    const snapshot = await query.get();
    const count = snapshot.docs.length;
    
    // Monitorar uso
    firebaseUsage.incrementReads(snapshot.docs.length);
    
    // Cache da contagem
    countCache[cacheKey] = { count, time: now };
    
    res.status(200).json({ 
      count,
      cached: false 
    });
    
  } catch (error: any) {
    console.error('Erro ao contar registros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
