import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebaseAdmin';

import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    res.status(200).json(vans);
  } catch (error: any) {
    console.error('Erro ao listar vans:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}