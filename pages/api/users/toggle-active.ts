import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, ativo } = req.body;

  if (!userId || typeof ativo !== 'boolean') {
    return res.status(400).json({ error: 'userId and ativo (boolean) are required' });
  }

  try {
    const db = admin.firestore();
    
    // Verificar se o usuário existe
    const userDoc = await db.collection('usuarios').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Atualizar status ativo/inativo
    await db.collection('usuarios').doc(userId).update({
      ativo: ativo,
      atualizadoEm: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true, 
      message: `Usuário ${ativo ? 'ativado' : 'inativado'} com sucesso` 
    });
  } catch (error: any) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
