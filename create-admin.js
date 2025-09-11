const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCElyqnf68Q7JIVmzPMvSZbobqQeh5kU6k",
  authDomain: "logistica-ba478.firebaseapp.com",
  projectId: "logistica-ba478",
  storageBucket: "logistica-ba478.firebasestorage.app",
  messagingSenderId: "840098449104",
  appId: "1:840098449104:web:f1952d8462904d161cc0d5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@teste.com', 'Senha@123');
    
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
      uid: userCredential.user.uid,
      perfil: 'admin'

    });
    
    console.log('Admin criado! Email: admin@teste.com | Senha: Senha@123');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

createAdmin();