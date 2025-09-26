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

export const getAllRecords = async () => {
  const records: any[] = [];
  let lastDoc: any = null;
  let hasMore = true;

  while (hasMore) {
    let q = query(
      collection(db, 'registros'),
      // orderBy('abertura.dataHora', 'desc'),
      limit(500) // traz em lotes de 500
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      hasMore = false;
    } else {
      records.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }
  }

  return records;
};
