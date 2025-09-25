import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, nome } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID é obrigatório' });
  }

  try {
    const db = admin.firestore();
    
    await db.collection('usuarios').doc(uid).update({
      nome: nome || ''
    });

    res.status(200).json({ message: 'Nome atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar nome:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}