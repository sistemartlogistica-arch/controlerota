import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { 
      userId, 
      vanId, 
      rotaId, 
      kmInicial, 
      kmFinal, 
      dataAbertura, 
      horaAbertura, 
      dataFechamento, 
      horaFechamento,
      diarioBordo 
    } = req.body;

    
    try {
      const db = admin.firestore();
      
      // Buscar dados do usuário
      const userDoc = await db.collection('usuarios').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log('Usuário não encontrado:', userId);
        return res.status(400).json({ error: 'Usuário não encontrado' });
      }
      
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
        
        if (kmFinal <= kmInicial) {
          return res.status(400).json({ error: 'KM final deve ser maior que KM inicial' });
        }
      }
      
      // Buscar dados da rota
      let origemFinal = '';
      let destinoFinal = '';
      let rotaIdFinal = null;
      
      if (rotaId) {
        const rotaDoc = await db.collection('rotas').doc(rotaId).get();
        const rotaData = rotaDoc.data();
        origemFinal = rotaData?.origem || '';
        destinoFinal = rotaData?.destino || '';
        rotaIdFinal = rotaId;
      }
      
      // Criar data/hora de abertura
      const dataHoraAbertura = new Date(`${dataAbertura}T${horaAbertura}:00`).toISOString();
      const dataHoraFechamento = new Date(`${dataFechamento}T${horaFechamento}:00`).toISOString();
      
      // Validar se data de fechamento é posterior à abertura
      if (new Date(dataHoraFechamento) <= new Date(dataHoraAbertura)) {
        return res.status(400).json({ error: 'Data de fechamento deve ser posterior à data de abertura' });
      }
      
      const registroData: any = {
        userId,
        userTipo: userData?.tipo || 'motorista',
        origem: origemFinal,
        destino: destinoFinal,
        abertura: {
          dataHora: dataHoraAbertura
        },
        fechamento: {
          dataHora: dataHoraFechamento
        }
      };

      // Adicionar campos específicos para motorista
      if (userTipo === 'motorista') {
        registroData.abertura.kmInicial = kmInicial;
        registroData.fechamento.kmFinal = kmFinal;
        if (diarioBordo) {
          registroData.fechamento.diarioBordo = diarioBordo;
        }
      }

      // Adicionar dados específicos do motorista
      if (userTipo === 'motorista' && vanData) {
        registroData.vanId = vanId;
        registroData.placa = vanData.placa;
        registroData.rotaId = rotaIdFinal;
      }

      const docRef = await db.collection('registros').add(registroData);
      
      // Atualizar KM da van para o KM final (apenas para motorista)
      if (userTipo === 'motorista' && vanId) {
        await db.collection('vans').doc(vanId).update({
          kmAtual: kmFinal
        });
      }
      
      // Nota: Cache de registros será limpo automaticamente no próximo restart do servidor
      // ou pode ser implementado um sistema de invalidação mais sofisticado
      
      res.status(201).json({ id: docRef.id });
    } catch (error: any) {
      console.error('Erro ao criar registro completo:', error);
      res.status(400).json({ error: 'Failed to create complete record' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

