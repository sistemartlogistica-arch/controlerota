import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

// Cache para registros - mais agressivo para economizar cota
const recordsCache: { [key: string]: { data: any; time: number } } = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos para registros

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
      Object.keys(recordsCache).forEach(key => delete recordsCache[key]);
      
      res.status(201).json({ id: docRef.id });
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to create record' });
    }
  } else if (req.method === 'GET') {
    const { userId, page = 1 } = req.query;
    
    // Criar chave de cache baseada nos parâmetros
    const cacheKey = userId ? `records_${userId}` : 'records_all';
    
    // Verificar cache
    const now = Date.now();
    if (recordsCache[cacheKey] && (now - recordsCache[cacheKey].time) < CACHE_DURATION) {
      return res.status(200).json(recordsCache[cacheKey].data);
    }
    
    try {
      const db = admin.firestore();
      
      let query = db.collection('registros');
      
      if (userId) {
        query = query.where('userId', '==', userId) as any;
      }
      
      const snapshot = await query.get();
      const records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
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