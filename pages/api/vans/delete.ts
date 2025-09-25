import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID da van é obrigatório' });
  }

  try {
    const db = admin.firestore();
    
    // Desativar van ao invés de deletar
    await db.collection('vans').doc(id).update({
      ativa: false,
      desativadaEm: new Date().toISOString()
    });

    res.status(200).json({ message: 'Van desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar van:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}