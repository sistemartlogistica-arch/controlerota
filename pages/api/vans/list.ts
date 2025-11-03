import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Cache global compartilhado
if (typeof global !== 'undefined') {
  if (!(global as any).vansCache) {
    (global as any).vansCache = null;
    (global as any).vansCacheTime = 0;
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos (vans mudam pouco, mas não muito longo)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar cache global
  const now = Date.now();
  const globalCache = (global as any).vansCache;
  const globalCacheTime = (global as any).vansCacheTime;
  
  if (globalCache && (now - globalCacheTime) < CACHE_DURATION) {
    return res.status(200).json(globalCache);
  }

  try {
    const db = admin.firestore();

    const snapshot = await db
      .collection('vans')
      .where('ativa', '==', true)
      .get();

    const vans = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => a.placa.localeCompare(b.placa));

    // Atualizar cache global
    (global as any).vansCache = vans;
    (global as any).vansCacheTime = now;

    res.status(200).json(vans);
  } catch (error: any) {
    // Tratamento específico para RESOURCE_EXHAUSTED
    if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error('Cota excedida ao listar vans. Retornando cache:', error);
      // Tentar retornar cache mesmo se expirado
      if ((global as any).vansCache) {
        return res.status(200).json((global as any).vansCache);
      }
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
        retryAfter: 60 
      });
    }
    console.error('Erro ao listar vans:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}