import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origem, destino } = req.body;

  if (!origem || !destino) {
    return res.status(400).json({ error: 'Origem e destino são obrigatórios' });
  }

  try {
    const db = admin.firestore();
    
    const rotaData = {
      origem: origem.trim(),
      destino: destino.trim(),
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await db.collection('rotas').add(rotaData);
    
    res.status(201).json({ id: docRef.id, ...rotaData });
  } catch (error: any) {
    console.error('Erro ao criar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}