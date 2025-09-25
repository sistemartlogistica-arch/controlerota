import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID é obrigatório' });
  }

  try {
    // Deletar do Firebase Auth (se existir)
    try {
      await admin.auth().deleteUser(uid);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.warn(`Usuário ${uid} não encontrado no Auth, prosseguindo apenas com Firestore...`);
      } else {
        throw authError;
      }
    }

    // Deletar do Firestore
    await admin.firestore().collection('usuarios').doc(uid).delete();

    return res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error.code || error.message, error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }

}