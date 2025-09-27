import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { firebaseUsage } from '../../../lib/monitoring/firebaseUsage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obter parâmetros de GET ou POST
  const params = req.method === 'GET' ? req.query : req.body;
  
  const {
    userId,
    vanId,
    userTipo,
    dataInicio,
    dataFim,
    status = 'todos',
    page = 1,
    pageSize = 50
  } = params;

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
    
    // Verificar se há filtros aplicados
    const hasFilters = userId || vanId || userTipo || dataInicio || dataFim || (status && status !== 'todos');
    
    // Aplicar paginação sempre, mas com lógica diferente para filtros
    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const offset = (pageNum - 1) * pageSizeNum;
    
    if (hasFilters) {
      // Com filtros: primeiro contar total, depois aplicar paginação se > 50
      const countQuery = query;
      const countSnapshot = await countQuery.get();
      const totalCount = countSnapshot.docs.length;
      
      if (totalCount > 50) {
        // Se mais de 50 resultados, aplicar paginação
        query = query.limit(pageSizeNum);
        
        if (offset > 0) {
          // Para paginação com filtros, precisamos replicar a query
          const tempQuery: any = db.collection('registros');
          
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
      }
      // Se 50 ou menos resultados, não aplicar paginação
    } else {
      // Sem filtros: sempre aplicar paginação
      query = query.limit(pageSizeNum);
      
      if (offset > 0) {
        const tempQuery = db.collection('registros')
          .orderBy('abertura.dataHora', 'desc')
          .limit(offset);
        
        const tempSnapshot = await tempQuery.get();
        if (tempSnapshot.docs.length > 0) {
          const lastDoc = tempSnapshot.docs[tempSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }
    }
    
    // Executar query
    const snapshot = await query.get();
    const records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    // Monitorar uso
    firebaseUsage.incrementReads(snapshot.docs.length);
    
    // Calcular informações de paginação
    const totalCount = hasFilters ? 
      (await query.limit(0).get()).docs.length : 
      records.length;
    
    const hasMore = records.length === pageSizeNum;
    const totalPages = Math.ceil(totalCount / pageSizeNum);
    
    res.status(200).json({
      records,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: totalCount,
        totalPages: totalPages,
        hasMore: hasMore
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar registros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
