// pages/api/rotas/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Cache simples em memória
let cache: any = null;
let cacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (rotas mudam pouco, mas mantém atualizado)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar cache
  const now = Date.now();
  if (cache && (now - cacheTime) < CACHE_DURATION) {
    return res.status(200).json(cache);
  }

  try {
    const db = admin.firestore();

    const snapshot = await db
      .collection('rotas')
      .where('ativa', '==', true)
      .get();

    const rotas = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => (a.origem || '').localeCompare(b.origem || ''));

    // Atualizar cache
    cache = rotas;
    cacheTime = now;

    res.status(200).json(rotas);
  } catch (error: any) {
    // Tratamento específico para RESOURCE_EXHAUSTED
    if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error('Cota excedida ao listar rotas. Retornando cache:', error);
      // Tentar retornar cache mesmo se expirado
      if (cache) {
        return res.status(200).json(cache);
      }
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
        retryAfter: 60 
      });
    }
    console.error('Erro ao listar rotas:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}
