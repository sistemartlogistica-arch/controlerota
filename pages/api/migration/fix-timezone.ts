import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, dryRun = true, beforeDate } = req.body;

  try {
    const db = admin.firestore();
    
    // Buscar todos os registros
    const snapshot = await db.collection('registros').get();
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const recordsToFix = [];
    const fixedRecords = [];
    
    // Data de corte: registros criados antes desta data são considerados problemáticos
    const cutoffDate = beforeDate ? new Date(beforeDate) : new Date('2025-01-15T00:00:00Z');
    
    for (const record of records) {
      let needsFix = false;
      const updates: any = {};
      
      // Verificar se o registro foi criado antes da data de corte
      const recordCreatedAt = (record as any).createdAt ? new Date((record as any).createdAt) : 
                             (record as any).abertura?.dataHora ? new Date((record as any).abertura.dataHora) : 
                             new Date('1900-01-01'); // Fallback para registros muito antigos
      
      const isOldRecord = recordCreatedAt < cutoffDate;
      
      // Verificar data de abertura
      if ((record as any).abertura?.dataHora && isOldRecord) {
        const aberturaDate = new Date((record as any).abertura.dataHora);
        
        // Verificar se a data não tem offset de fuso horário (está em UTC)
        const isUTC = !(record as any).abertura.dataHora.includes('Z') && 
                     !(record as any).abertura.dataHora.includes('+') && 
                     !(record as any).abertura.dataHora.includes('-', 10);
        
        if (isUTC) {
          // Adicionar 3 horas para converter de UTC para horário brasileiro
          const aberturaLocal = new Date(aberturaDate.getTime() + (3 * 60 * 60 * 1000));
          needsFix = true;
          updates['abertura.dataHora'] = aberturaLocal.toISOString();
        }
      }
      
      // Verificar data de fechamento
      if ((record as any).fechamento?.dataHora && isOldRecord) {
        const fechamentoDate = new Date((record as any).fechamento.dataHora);
        
        const isUTC = !(record as any).fechamento.dataHora.includes('Z') && 
                     !(record as any).fechamento.dataHora.includes('+') && 
                     !(record as any).fechamento.dataHora.includes('-', 10);
        
        if (isUTC) {
          const fechamentoLocal = new Date(fechamentoDate.getTime() + (3 * 60 * 60 * 1000));
          needsFix = true;
          updates['fechamento.dataHora'] = fechamentoLocal.toISOString();
        }
      }
      
      if (needsFix) {
        recordsToFix.push({
          id: (record as any).id,
          createdAt: recordCreatedAt.toISOString(),
          isOldRecord,
          original: {
            abertura: (record as any).abertura?.dataHora,
            fechamento: (record as any).fechamento?.dataHora
          },
          updates,
          fixed: {
            abertura: updates['abertura.dataHora'] || (record as any).abertura?.dataHora,
            fechamento: updates['fechamento.dataHora'] || (record as any).fechamento?.dataHora
          }
        });
        
        // Se não é dry run, aplicar a correção
        if (!dryRun && action === 'fix') {
          // Adicionar timestamp de migração
          updates['timezoneMigratedAt'] = new Date().toISOString();
          updates['timezoneMigratedBy'] = 'system';
          
          await db.collection('registros').doc((record as any).id).update(updates);
          fixedRecords.push((record as any).id);
        }
      }
    }
    
    res.status(200).json({
      totalRecords: records.length,
      recordsToFix: recordsToFix.length,
      fixedRecords: fixedRecords.length,
      dryRun,
      cutoffDate: cutoffDate.toISOString(),
      records: recordsToFix
    });
    
  } catch (error: any) {
    console.error('Erro na migração de fuso horário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
