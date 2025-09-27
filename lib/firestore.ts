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

/**
 * Busca todos os registros do Firestore
 * @param limitCount - Limite de registros (opcional, padrão: todos)
 * @param sinceTimestamp - Buscar apenas registros após este timestamp (para delta updates)
 * @returns Array de registros ordenados por data de abertura (mais recentes primeiro)
 */
export const getAllRecords = async (limitCount?: number, sinceTimestamp?: string) => {
  const records: any[] = [];
  let lastDoc: any = null;
  let hasMore = true;
  let totalFetched = 0;

  console.info(`📡 Buscando registros${sinceTimestamp ? ' (delta update)' : ' (full load)'}...`);

  while (hasMore && (!limitCount || totalFetched < limitCount)) {
    let q = query(
      collection(db, 'registros'),
      orderBy('abertura.dataHora', 'desc'), // Ordenar por data de abertura (mais recentes primeiro)
      limit(limitCount ? Math.min(500, limitCount - totalFetched) : 500)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      hasMore = false;
    } else {
      const batchRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Se há timestamp de referência, filtrar registros mais recentes
      if (sinceTimestamp) {
        const filteredRecords = batchRecords.filter((record: any) => 
          record.abertura?.dataHora && 
          record.abertura.dataHora > sinceTimestamp
        );
        
        records.push(...filteredRecords);
        totalFetched += filteredRecords.length;
        
        // Se não há mais registros recentes, parar
        if (filteredRecords.length === 0) {
          hasMore = false;
        }
      } else {
        records.push(...batchRecords);
        totalFetched += batchRecords.length;
      }
      
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      // Se atingiu o limite, parar
      if (limitCount && totalFetched >= limitCount) {
        hasMore = false;
      }
    }
  }

  console.info(`✅ Busca concluída: ${records.length} registros encontrados`);
  return records;
};
