import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recordId } = req.query;

  if (!recordId) {
    return res.status(400).json({ error: 'recordId é obrigatório' });
  }

  try {
    const db = admin.firestore();
    const doc = await db.collection('registros').doc(recordId as string).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const record: any = { id: doc.id, ...doc.data() };
    
    const analysis = {
      recordId: record.id,
      abertura: null as any,
      fechamento: null as any
    };

    // Analisar data de abertura
    if (record.abertura?.dataHora) {
      const date = new Date(record.abertura.dataHora);
      const isUTC = !record.abertura.dataHora.includes('Z') && 
                   !record.abertura.dataHora.includes('+') && 
                   !record.abertura.dataHora.includes('-', 10);
      
      analysis.abertura = {
        original: record.abertura.dataHora,
        parsed: date.toISOString(),
        isUTC,
        utcTime: date.toLocaleString('pt-BR', { timeZone: 'UTC' }),
        localTime: date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        correctedTime: isUTC ? new Date(date.getTime() + (3 * 60 * 60 * 1000)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null
      };
    }

    // Analisar data de fechamento
    if (record.fechamento?.dataHora) {
      const date = new Date(record.fechamento.dataHora);
      const isUTC = !record.fechamento.dataHora.includes('Z') && 
                   !record.fechamento.dataHora.includes('+') && 
                   !record.fechamento.dataHora.includes('-', 10);
      
      analysis.fechamento = {
        original: record.fechamento.dataHora,
        parsed: date.toISOString(),
        isUTC,
        utcTime: date.toLocaleString('pt-BR', { timeZone: 'UTC' }),
        localTime: date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        correctedTime: isUTC ? new Date(date.getTime() + (3 * 60 * 60 * 1000)).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null
      };
    }

    res.status(200).json(analysis);
    
  } catch (error: any) {
    console.error('Erro ao analisar registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
