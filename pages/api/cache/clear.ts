import type { NextApiRequest, NextApiResponse } from 'next';
import { clearAllCaches, clearRecordsCache, clearVansCache, clearRotasCache, clearActiveUsersCache } from '../../../lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Limpar todos os caches
    clearAllCaches();
    
    res.status(200).json({ 
      success: true, 
      message: 'Cache limpo com sucesso' 
    });
  } catch (error: any) {
    console.error('Erro ao limpar cache:', error);
    res.status(500).json({ 
      error: 'Erro ao limpar cache', 
      details: error.message 
    });
  }
}

