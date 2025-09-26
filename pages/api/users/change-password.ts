import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Verifica se o usuário existe
    await admin.auth().getUser(uid);

    // Atualiza a senha
    await admin.auth().updateUser(uid, { password: newPassword });

    res.status(200).json({ success: true });
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error('Usuário não encontrado:', uid);
      res.status(404).json({ error: 'Usuário não encontrado' });
    } else {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Failed to change password', details: error.message });
    }
  }

}