import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../../lib/firebaseAdmin';
import { clearRecordsCache } from '../../../lib/cache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { id, kmInicial, kmFinal, dataAbertura, dataFechamento, diarioBordo } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    try {
      const db = admin.firestore();
      
      // Buscar o registro para pegar o vanId e userTipo
      const registroDoc = await db.collection('registros').doc(id).get();
      if (!registroDoc.exists) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }
      
      const registroData = registroDoc.data();
      if (!registroData) {
        return res.status(404).json({ error: 'Dados do registro não encontrados' });
      }
      
      const updateData: any = {};

      if (kmInicial !== null && kmInicial !== undefined) {
        updateData['abertura.kmInicial'] = kmInicial;
      }

      if (dataAbertura) {
        updateData['abertura.dataHora'] = dataAbertura;
      }

      if (kmFinal !== null && kmFinal !== undefined) {
        updateData['fechamento.kmFinal'] = kmFinal;
      }

      if (dataFechamento) {
        updateData['fechamento.dataHora'] = dataFechamento;
      }

      if (diarioBordo !== undefined) {
        updateData['fechamento.diarioBordo'] = diarioBordo;
      }

      await db.collection('registros').doc(id).update(updateData);

      // Atualizar KM da van se KM final foi alterado (apenas para motorista)
      if (kmFinal !== null && kmFinal !== undefined && 
          registroData.userTipo === 'motorista' && 
          registroData.vanId) {
        await db.collection('vans').doc(registroData.vanId).update({
          kmAtual: kmFinal
        });
      }

      // Limpar cache de registros após edição
      clearRecordsCache();

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    try {
      const db = admin.firestore();
      
      await db.collection('registros').doc(id).delete();
      
      // Limpar cache de registros após deleção
      clearRecordsCache();
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}