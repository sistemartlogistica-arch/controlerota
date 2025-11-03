import admin from '@/lib/firebaseAdmin';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API route para obter o número total de registros na coleção "registros"
 * 
 * @param req - Requisição HTTP
 * @param res - Resposta HTTP
 * @returns JSON com o count total de registros
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

 
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido. Use GET.' });
    return;
  }

  try {
   
    const registrosRef = admin.firestore().collection('registros');

    
    const snapshot = await registrosRef.count().get();

   
    const count = snapshot.data().count;

    
    res.status(200).json({
      count: count
    });

  } catch (error: any) {
    // Tratamento específico para RESOURCE_EXHAUSTED
    if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error('Cota excedida ao contar registros:', error);
      // Retornar erro mais amigável
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
        retryAfter: 60 
      });
    }
    
    console.error('Erro ao contar registros:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor ao contar registros'
    });
  }
}
