import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Cache simples em memória
let cache: any = null;
let cacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

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
      .collection('vans')
      .where('ativa', '==', true)
      .get();

    const vans = snapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => a.placa.localeCompare(b.placa));

    // Atualizar cache
    cache = vans;
    cacheTime = now;

    res.status(200).json(vans);
  } catch (error: any) {
    console.error('Erro ao listar vans:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}