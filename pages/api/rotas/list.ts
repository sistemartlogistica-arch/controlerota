// pages/api/rotas/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    res.status(200).json(rotas);
  } catch (error: any) {
    console.error('Erro ao listar rotas:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}
