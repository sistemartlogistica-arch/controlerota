import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Função para invalidar cache de vans
function invalidateVansCache() {
  // Limpar cache global se existir
  if (typeof global !== 'undefined' && (global as any).vansCache) {
    (global as any).vansCache = null;
    (global as any).vansCacheTime = 0;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, placa } = req.body;

  if (!id || !placa) {
    return res.status(400).json({ error: 'ID e placa são obrigatórios' });
  }

  try {
    const db = admin.firestore();
    
    await db.collection('vans').doc(id).update({
      placa: placa
    });

    // Invalidar cache de vans para forçar atualização
    invalidateVansCache();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}