import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase - SUBSTITUA com suas credenciais
const firebaseConfig = {
    apiKey: "AIzaSyAd7gLxuuCLplyQjrzt2oWvdeEL3N4ApJY",
    authDomain: "chords-app-fb447.firebaseapp.com",
    projectId: "chords-app-fb447",
    storageBucket: "chords-app-fb447.firebasestorage.app",
    messagingSenderId: "700316842832",
    appId: "1:700316842832:web:de67226304830a70050a55"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

