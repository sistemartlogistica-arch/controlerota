import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Cache para registros abertos
const openRecordsCache: { [key: string]: { data: any; time: number } } = {};
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos para registros abertos (mais frequente)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  
  // Criar chave de cache baseada nos parâmetros
  const cacheKey = userId ? `open_records_${userId}` : 'open_records_all';
  
  // Verificar cache
  const now = Date.now();
  if (openRecordsCache[cacheKey] && (now - openRecordsCache[cacheKey].time) < CACHE_DURATION) {
    return res.status(200).json(openRecordsCache[cacheKey].data);
  }
  
  try {
    const db = admin.firestore();
    
    let query = db.collection('registros')
      .where('fechamento', '==', null); // Apenas registros abertos
    
    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }
    
    const snapshot = await query.get();
    let records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Filtrar apenas registros de usuários ativos (client-side para evitar índices complexos)
    if (!userId) {
      const activeUsersSnapshot = await db.collection('usuarios')
        .where('ativo', '==', true)
        .get();
      const activeUserIds = activeUsersSnapshot.docs.map(doc => doc.id);
      
      // Também incluir usuários que não têm o campo 'ativo' definido (usuários existentes)
      const allUsersSnapshot = await db.collection('usuarios').get();
      const usersWithoutActiveField = allUsersSnapshot.docs
        .filter(doc => !doc.data().hasOwnProperty('ativo'))
        .map(doc => doc.id);
      
      const allActiveUserIds = [...activeUserIds, ...usersWithoutActiveField];
      records = records.filter(record => allActiveUserIds.includes(record.userId));
    }
    
    // Atualizar cache
    openRecordsCache[cacheKey] = { data: records, time: now };
    
    res.status(200).json(records);
  } catch (error: any) {
    console.error('Erro ao buscar registros abertos:', error);
    res.status(400).json({ error: 'Failed to fetch open records' });
  }
}
