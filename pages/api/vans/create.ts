import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { clearVansCache } from '../../../lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { placa, kmInicial = 0 } = req.body;

  if (!placa) {
    return res.status(400).json({ error: 'Placa é obrigatória' });
  }

  try {
    const db = admin.firestore();
    
    // Verificar se a placa já existe
    const querySnapshot = await db
      .collection('vans')
      .where('placa', '==', placa.toUpperCase())
      .get();
    
    if (!querySnapshot.empty) {
      return res.status(400).json({ error: 'Van com esta placa já existe' });
    }

    // Criar nova van
    const vanData = {
      placa: placa.toUpperCase(),
      kmAtual: kmInicial,
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await db.collection('vans').add(vanData);
    
    // Limpar cache de vans após criação
    clearVansCache();
    
    res.status(201).json({ id: docRef.id, ...vanData });
  } catch (error: any) {
    console.error('Erro ao criar van:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}