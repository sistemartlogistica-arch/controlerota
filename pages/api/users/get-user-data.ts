import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Cache simples em memória por usuário
const userCache: { [key: string]: { data: any; time: number } } = {};
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 horas

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.query;

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'UID é obrigatório' });
  }

  // Verificar cache
  const now = Date.now();
  if (userCache[uid] && (now - userCache[uid].time) < CACHE_DURATION) {
    return res.status(200).json(userCache[uid].data);
  }

  try {
    const docRef = admin.firestore().collection('usuarios').doc(uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = { id: docSnap.id, ...docSnap.data() };
    
    // Atualizar cache
    userCache[uid] = { data: userData, time: now };
    
    console.log('Usuário buscado com sucesso:', userData);

    res.status(200).json(userData);
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}
