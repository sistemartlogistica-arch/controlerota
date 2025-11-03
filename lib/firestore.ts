import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';

export const createRecord = async (userId: string, kmInicial: number, dataHora?: string) => {
  return await addDoc(collection(db, 'registros'), {
    userId,
    abertura: {
      kmInicial,
      dataHora: dataHora || new Date().toISOString()
    }
  });
};

export const closeRecord = async (recordId: string, kmFinal: number, dataHora?: string) => {
  await updateDoc(doc(db, 'registros', recordId), {
    fechamento: {
      kmFinal,
      dataHora: dataHora || new Date().toISOString()
    }
  });
};

export const getOpenRecord = async (userId: string) => {
  const q = query(
    collection(db, 'registros'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const openRecord = snapshot.docs.find(doc => !doc.data().fechamento);
  return openRecord ? { id: openRecord.id, ...openRecord.data() } : null;
};

export const getAllRecords = async (page = 1, pageSize = 100) => {
  const pageNum = parseInt(page.toString()) || 1;
  const limitNum = parseInt(pageSize.toString()) || 100;

  // OTIMIZAÇÃO: Buscar todos os registros uma vez (sem paginação recursiva)
  // A paginação será aplicada em memória após filtrar por usuários ativos
  const q = query(
    collection(db, 'registros'),
    orderBy('abertura.dataHora', 'desc')
  );

  const snapshot = await getDocs(q);
  let allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // OTIMIZAÇÃO: UMA ÚNICA BUSCA de usuários (eliminando a redundância de duas buscas)
  // Buscar todos os usuários de uma vez e filtrar em memória
  const allUsersSnapshot = await getDocs(collection(db, 'usuarios'));
  const allActiveUserIds = allUsersSnapshot.docs
    .filter((doc) => {
      const data = doc.data();
      // Considerar ativo se não tem campo 'ativo' definido OU se 'ativo' é true
      return !data.hasOwnProperty('ativo') || data.ativo === true;
    })
    .map((doc) => doc.id);
  
  // Filtrar registros de usuários ativos
  const filteredRecords = allRecords.filter((record: any) => allActiveUserIds.includes(record.userId));
  
  // Aplicar paginação em memória (mais eficiente que buscar documentos anteriores recursivamente)
  const offset = (pageNum - 1) * limitNum;
  const paginatedRecords = filteredRecords.slice(offset, offset + limitNum);

  return paginatedRecords;
};
