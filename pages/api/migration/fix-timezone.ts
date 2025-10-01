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
      const recordCreatedAt = record.createdAt ? new Date(record.createdAt) : 
                             record.abertura?.dataHora ? new Date(record.abertura.dataHora) : 
                             new Date('1900-01-01'); // Fallback para registros muito antigos
      
      const isOldRecord = recordCreatedAt < cutoffDate;
      
      // Verificar data de abertura
      if (record.abertura?.dataHora && isOldRecord) {
        const aberturaDate = new Date(record.abertura.dataHora);
        
        // Verificar se a data não tem offset de fuso horário (está em UTC)
        const isUTC = !record.abertura.dataHora.includes('Z') && 
                     !record.abertura.dataHora.includes('+') && 
                     !record.abertura.dataHora.includes('-', 10);
        
        if (isUTC) {
          // Adicionar 3 horas para converter de UTC para horário brasileiro
          const aberturaLocal = new Date(aberturaDate.getTime() + (3 * 60 * 60 * 1000));
          needsFix = true;
          updates['abertura.dataHora'] = aberturaLocal.toISOString();
        }
      }
      
      // Verificar data de fechamento
      if (record.fechamento?.dataHora && isOldRecord) {
        const fechamentoDate = new Date(record.fechamento.dataHora);
        
        const isUTC = !record.fechamento.dataHora.includes('Z') && 
                     !record.fechamento.dataHora.includes('+') && 
                     !record.fechamento.dataHora.includes('-', 10);
        
        if (isUTC) {
          const fechamentoLocal = new Date(fechamentoDate.getTime() + (3 * 60 * 60 * 1000));
          needsFix = true;
          updates['fechamento.dataHora'] = fechamentoLocal.toISOString();
        }
      }
      
      if (needsFix) {
        recordsToFix.push({
          id: record.id,
          createdAt: recordCreatedAt.toISOString(),
          isOldRecord,
          original: {
            abertura: record.abertura?.dataHora,
            fechamento: record.fechamento?.dataHora
          },
          updates,
          fixed: {
            abertura: updates['abertura.dataHora'] || record.abertura?.dataHora,
            fechamento: updates['fechamento.dataHora'] || record.fechamento?.dataHora
          }
        });
        
        // Se não é dry run, aplicar a correção
        if (!dryRun && action === 'fix') {
          // Adicionar timestamp de migração
          updates['timezoneMigratedAt'] = new Date().toISOString();
          updates['timezoneMigratedBy'] = 'system';
          
          await db.collection('registros').doc(record.id).update(updates);
          fixedRecords.push(record.id);
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
