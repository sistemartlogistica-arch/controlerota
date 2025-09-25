import { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const db = admin.firestore();
    
    const { id, origem, destino } = req.body;

    if (!id || !origem || !destino) {
      return res.status(400).json({ error: 'ID, origem e destino são obrigatórios' });
    }

    await db.collection('rotas').doc(id).update({
      origem,
      destino
    });

    res.status(200).json({ message: 'Rota atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}