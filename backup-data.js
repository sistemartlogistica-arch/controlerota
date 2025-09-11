const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyAKCRPxkWANrydb-WDAzJ-1-38VSiXFM3Q",
  authDomain: "kilometers-driven.firebaseapp.com",
  projectId: "kilometers-driven",
  storageBucket: "kilometers-driven.firebasestorage.app",
  messagingSenderId: "829528057571",
  appId: "1:829528057571:web:ae1e5d1c8ed39cd92a07d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function backupData() {
  try {
    const backup = {};
    const collections = ['usuarios', 'registros', 'rotas', 'vans'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      backup[collectionName] = {};
      snapshot.forEach(doc => {
        backup[collectionName][doc.id] = doc.data();
      });
      console.log(`${collectionName}: ${Object.keys(backup[collectionName]).length} documentos`);
    }
    
    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`\nBackup salvo em: ${filename}`);
    
  } catch (error) {
    console.error('Erro no backup:', error.message);
  }
}

backupData();