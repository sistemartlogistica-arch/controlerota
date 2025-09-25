import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = admin.firestore();
    
    const snapshot = await db
      .collection('vans')
      .where('ativa', '==', false)
      .get();
    
    const vans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(vans);
  } catch (error) {
    console.error('Erro ao buscar vans desativadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}