import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { clearVansCache } from '../../../lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID é obrigatório' });
  }

  try {
    const db = admin.firestore();
    
    await db.collection('vans').doc(id).update({
      ativa: true
    });

    // Limpar cache de vans após ativação
    clearVansCache();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao ativar van:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}