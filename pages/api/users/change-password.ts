import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    res.status(400).json({ error: 'Failed to change password' });
  }
}