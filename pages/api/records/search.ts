import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { firebaseUsage } from '../../../lib/monitoring/firebaseUsage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
    vanId,
    userTipo,
    dataInicio,
    dataFim,
    status = 'todos',
    page = 1,
    pageSize = 50
  } = req.query;

  try {
    const db = admin.firestore();
    
    // Construir query base
    let query: any = db.collection('registros');
    
    // Aplicar filtros
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (vanId) {
      query = query.where('vanId', '==', vanId);
    }
    
    if (userTipo) {
      query = query.where('userTipo', '==', userTipo);
    }
    
    if (dataInicio) {
      const startDate = new Date(dataInicio as string);
      query = query.where('abertura.dataHora', '>=', startDate.toISOString());
    }
    
    if (dataFim) {
      const endDate = new Date(dataFim as string);
      endDate.setHours(23, 59, 59, 999);
      query = query.where('abertura.dataHora', '<=', endDate.toISOString());
    }
    
    if (status === 'aberto') {
      query = query.where('fechamento', '==', null);
    } else if (status === 'fechado') {
      query = query.where('fechamento', '!=', null);
    }
    
    // Ordenação
    query = query.orderBy('abertura.dataHora', 'desc');
    
    // Paginação
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;
    
    query = query.limit(pageSizeNum);
    
    if (offset > 0) {
      // Para paginação real, precisamos do último documento da página anterior
      const tempQuery = db.collection('registros');
      
      // Replicar filtros para a query temporária
      if (userId) tempQuery.where('userId', '==', userId);
      if (vanId) tempQuery.where('vanId', '==', vanId);
      if (userTipo) tempQuery.where('userTipo', '==', userTipo);
      if (dataInicio) {
        const startDate = new Date(dataInicio as string);
        tempQuery.where('abertura.dataHora', '>=', startDate.toISOString());
      }
      if (dataFim) {
        const endDate = new Date(dataFim as string);
        endDate.setHours(23, 59, 59, 999);
        tempQuery.where('abertura.dataHora', '<=', endDate.toISOString());
      }
      if (status === 'aberto') tempQuery.where('fechamento', '==', null);
      else if (status === 'fechado') tempQuery.where('fechamento', '!=', null);
      
      tempQuery.orderBy('abertura.dataHora', 'desc').limit(offset);
      
      const tempSnapshot = await tempQuery.get();
      if (tempSnapshot.docs.length > 0) {
        const lastDoc = tempSnapshot.docs[tempSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    // Executar query
    const snapshot = await query.get();
    const records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Monitorar uso
    firebaseUsage.incrementReads(snapshot.docs.length);
    
    res.status(200).json({
      records,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        hasMore: records.length === pageSizeNum
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar registros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
