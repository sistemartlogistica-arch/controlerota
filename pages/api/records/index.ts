import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { recordsCache, CACHE_DURATION, clearRecordsCache, getActiveUserIds, clearActiveUsersCache } from '../../../lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, vanId, kmInicial, rotaId, origem, destino } = req.body;
    
    try {
      const db = admin.firestore();
      
      const userDoc = await db.collection('usuarios').doc(userId).get();
      const userData = userDoc.data();
      const userTipo = userData?.tipo || 'motorista';
      
      let vanData = null;
      
      if (userTipo === 'motorista') {
        // Verificar se a van existe e pegar KM atual (apenas para motorista)
        const vanDoc = await db.collection('vans').doc(vanId).get();
        if (!vanDoc.exists) {
          return res.status(400).json({ error: 'Van não encontrada' });
        }
        
        vanData = vanDoc.data();
        if (vanData && kmInicial < vanData.kmAtual) {
          return res.status(400).json({ error: `KM inicial deve ser maior ou igual a ${vanData.kmAtual}` });
        }
      }
      
      let origemFinal = '';
      let destinoFinal = '';
      let rotaIdFinal = null;
      
      if (rotaId) {
        // Motorista - buscar dados da rota
        const rotaDoc = await db.collection('rotas').doc(rotaId).get();
        const rotaData = rotaDoc.data();
        origemFinal = rotaData?.origem || '';
        destinoFinal = rotaData?.destino || '';
        rotaIdFinal = rotaId;
      } else if (origem && destino) {
        // Copiloto - usar origem e destino enviados
        origemFinal = origem;
        destinoFinal = destino;
      }
      
      const registroData: any = {
        userId,
        userTipo: userData?.tipo || 'motorista',
        origem: origemFinal,
        destino: destinoFinal,
        abertura: {
          dataHora: new Date().toISOString()
        }
      };

      // Adicionar dados específicos do motorista
      if (userTipo === 'motorista' && vanData) {
        registroData.vanId = vanId;
        registroData.placa = vanData.placa;
        registroData.rotaId = rotaIdFinal;
        registroData.abertura.kmInicial = kmInicial;
      }

      const docRef = await db.collection('registros').add(registroData);
      
      // Atualizar KM da van na abertura (apenas para motorista)
      if (userTipo === 'motorista' && vanId) {
        await db.collection('vans').doc(vanId).update({
          kmAtual: kmInicial
        });
      }
      
      // Limpar cache de registros
      clearRecordsCache();
      
      res.status(201).json({ id: docRef.id });
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to create record' });
    }
  } else if (req.method === 'GET') {
    const { userId, page = 1, limit = 50, onlyOpen = false, getAll = false } = req.query;
    
    // Criar chave de cache baseada nos parâmetros
    const cacheKey = userId ? `records_${userId}_${page}_${limit}_${onlyOpen}_${getAll}` : `records_all_${page}_${limit}_${onlyOpen}_${getAll}`;
    
    // Verificar cache
    const now = Date.now();
    if (recordsCache[cacheKey] && (now - recordsCache[cacheKey].time) < CACHE_DURATION) {
      return res.status(200).json(recordsCache[cacheKey].data);
    }
    
    try {
      const db = admin.firestore();
      
      let query = db.collection('registros');
      
      // Aplicar filtros
      if (userId) {
        query = query.where('userId', '==', userId) as any;
      }
      
      // Filtro para registros abertos apenas (para otimizar consulta de vans)
      if (onlyOpen === 'true') {
        query = query.where('fechamento', '==', null) as any;
      }
      
      // Adicionar ordenação apenas se não há filtro por userId (para evitar índice composto)
      if (!userId) {
        query = query.orderBy('abertura.dataHora', 'asc') as any;
      }
      
      // Se getAll=true, retornar todos os registros (sem paginação)
      if (getAll === 'true') {
        const snapshot = await query.get();
        let records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        
        // Ordenar por data se não foi ordenado no Firestore
        if (userId) {
          records = records.sort((a, b) => {
            const dateA = new Date(a.abertura?.dataHora || 0);
            const dateB = new Date(b.abertura?.dataHora || 0);
            return dateA.getTime() - dateB.getTime(); // Crescente
          });
        }
        
        // Filtrar apenas registros de usuários ativos (client-side para evitar índices complexos)
        if (!userId) {
          const activeUserIds = await getActiveUserIds(db);
          records = records.filter(record => activeUserIds.includes(record.userId));
        }
        
        // Atualizar cache
        recordsCache[cacheKey] = { data: records, time: now };
        
        return res.status(200).json(records);
      }
      
      // Paginação normal
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 50;
      const offset = (pageNum - 1) * limitNum;
      
      query = query.offset(offset).limit(limitNum) as any;
      
      const snapshot = await query.get();
      let records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      // Ordenar por data se não foi ordenado no Firestore
      if (userId) {
        records = records.sort((a, b) => {
          const dateA = new Date(a.abertura?.dataHora || 0);
          const dateB = new Date(b.abertura?.dataHora || 0);
          return dateA.getTime() - dateB.getTime(); // Crescente
        });
      }
      
      // Filtrar apenas registros de usuários ativos (client-side para evitar índices complexos)
      if (!userId) {
        const activeUserIds = await getActiveUserIds(db);
        records = records.filter(record => activeUserIds.includes(record.userId));
      }
      
      // Atualizar cache
      recordsCache[cacheKey] = { data: records, time: now };
      
      res.status(200).json(records);
    } catch (error: any) {
      console.error('Erro ao buscar registros:', error);
      res.status(400).json({ error: 'Failed to fetch records' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}