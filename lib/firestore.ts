import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';

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
  const records: any[] = [];
  const pageNum = parseInt(page.toString()) || 1;
  const limitNum = parseInt(pageSize.toString()) || 100;
  const offset = (pageNum - 1) * limitNum;

  let q = query(
    collection(db, 'registros'),
    orderBy('abertura.dataHora', 'desc'),
    limit(limitNum)
  );

  if (offset > 0) {
    // Para paginação, precisamos buscar documentos anteriores
    let tempQuery = query(
      collection(db, 'registros'),
      orderBy('abertura.dataHora', 'desc'),
      limit(offset)
    );
    
    const tempSnapshot = await getDocs(tempQuery);
    if (!tempSnapshot.empty) {
      const lastDoc = tempSnapshot.docs[tempSnapshot.docs.length - 1];
      q = query(q, startAfter(lastDoc));
    }
  }

  const snapshot = await getDocs(q);
  let allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filtrar apenas registros de usuários ativos (client-side para evitar índices complexos)
  const activeUsersQuery = query(
    collection(db, 'usuarios'),
    where('ativo', '==', true)
  );
  const activeUsersSnapshot = await getDocs(activeUsersQuery);
  const activeUserIds = activeUsersSnapshot.docs.map(doc => doc.id);
  
  const filteredRecords = allRecords.filter((record: any) => activeUserIds.includes(record.userId));
  records.push(...filteredRecords);

  return records;
};
