/**
 * Script de Migração: Exporta shapes hardcoded para Firebase Firestore
 * 
 * Executar apenas UMA VEZ após configurar as credenciais do Firebase
 * 
 * Uso: npx tsx scripts/migrateShapesToFirebase.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as readline from 'readline';

// CONFIGURE SUAS CREDENCIAIS AQUI
const firebaseConfig = {
    apiKey: "AIzaSyAd7gLxuuCLplyQjrzt2oWvdeEL3N4ApJY",
    authDomain: "chords-app-fb447.firebaseapp.com",
    projectId: "chords-app-fb447",
    storageBucket: "chords-app-fb447.firebasestorage.app",
    messagingSenderId: "700316842832",
    appId: "1:700316842832:web:de67226304830a70050a55"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Helper para input do terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

interface ChordShape {
  name?: string;
  baseString: 6 | 5 | 4;
  frets: number[];
  fingers?: number[];
  rootFretOffset?: number;
}

// Shapes hardcoded do GuitarChordModal.tsx
const SHAPES_TO_MIGRATE: Record<string, { name: string; shapes: ChordShape[] }> = {
  'major': {
    name: 'Maior (Tríade)',
    shapes: [
      { name: "Formato de C (CAGED)", baseString: 5, frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], rootFretOffset: 3 },
      { name: "Formato de A (CAGED)", baseString: 5, frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] },
      { name: "Formato de G (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], rootFretOffset: 3 },
      { name: "Formato de E (CAGED)", baseString: 6, frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
      { name: "Formato de D (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
    ]
  },
  'minor': {
    name: 'Menor (Tríade)',
    shapes: [
      { name: "Formato de Em", baseString: 6, frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] },
      { name: "Formato de Am", baseString: 5, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] },
      { name: "Formato de Dm", baseString: 4, frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 4, 1] }
    ]
  },
  'dom7': {
    name: 'Dominante (7)',
    shapes: [
      { name: "Formato de C7 (CAGED)", baseString: 5, frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], rootFretOffset: 3 },
      { name: "Formato de A7 (CAGED)", baseString: 5, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] },
      { name: "Formato de G7 (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], rootFretOffset: 3 },
      { name: "Formato de E7 (CAGED)", baseString: 6, frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
      { name: "Formato de D7 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }
    ]
  },
  'maj7': {
    name: 'Sétima Maior',
    shapes: [
      { name: "Formato de Cmaj7 (CAGED)", baseString: 5, frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], rootFretOffset: 3 },
      { name: "Formato de Amaj7 (CAGED)", baseString: 5, frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1] },
      { name: "Formato de Gmaj7 (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 4], rootFretOffset: 3 },
      { name: "Formato de Emaj7 (CAGED)", baseString: 6, frets: [0, -1, 1, 1, 0, -1], fingers: [1, 0, 3, 4, 2, 0] },
      { name: "Formato de Dmaj7 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] }
    ]
  },
  'm7': {
    name: 'Menor com Sétima',
    shapes: [
      { name: "Formato de Cm7 (CAGED)", baseString: 5, frets: [-1, 3, 1, 0, 1, 0], fingers: [0, 3, 1, 0, 2, 0], rootFretOffset: 3 },
      { name: "Formato de Am7 (CAGED)", baseString: 5, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] },
      { name: "Formato de Gm7 (CAGED)", baseString: 6, frets: [3, 1, 0, 0, 0, 1], fingers: [3, 1, 0, 0, 0, 2], rootFretOffset: 3 },
      { name: "Formato de Em7 (CAGED)", baseString: 6, frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
      { name: "Formato de Dm7 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] }
    ]
  },
  'm7b5': {
    name: 'Meio Diminuto',
    shapes: [
      { name: "Formato de Cm7b5 (CAGED)", baseString: 5, frets: [-1, 3, 1, 0, 1, -1], fingers: [0, 3, 1, 0, 2, 0], rootFretOffset: 3 },
      { name: "Formato de Am7b5 (CAGED)", baseString: 5, frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 1, 2, 1, 3, 0] },
      { name: "Formato de Gm7b5 (CAGED)", baseString: 6, frets: [3, 1, 0, 0, -1, 1], fingers: [3, 1, 0, 0, 0, 2], rootFretOffset: 3 },
      { name: "Formato de Em7b5 (CAGED)", baseString: 6, frets: [0, -1, 0, 0, -1, -1], fingers: [1, 0, 2, 3, 0, 0] },
      { name: "Formato de Dm7b5 (CAGED)", baseString: 4, frets: [-1, -1, 0, 1, 1, 1], fingers: [0, 0, 0, 1, 2, 3] }
    ]
  },
  'dim7': {
    name: 'Diminuto',
    shapes: [
      { name: "Formato Diminuto", baseString: 5, frets: [-1, 0, 1, -1, 1, -1], fingers: [0, 1, 2, 0, 3, 0] }
    ]
  },
  'dim': {
    name: 'Diminuto (Tríade)',
    shapes: [
      { name: "Tríade Diminuta", baseString: 5, frets: [-1, 0, 1, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] }
    ]
  },
  'aug': {
    name: 'Aumentado',
    shapes: [
      { name: "Aumentado", baseString: 6, frets: [0, -1, 2, 1, 1, -1], fingers: [1, 0, 3, 2, 2, 0] }
    ]
  },
  'add9': {
    name: 'Maior com 9ª (add9)',
    shapes: [
      { name: "Formato de Cadd9 (CAGED)", baseString: 5, frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], rootFretOffset: 3 },
      { name: "Formato de Aadd9 (CAGED)", baseString: 5, frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 4, 2, 0] },
      { name: "Formato de Gadd9 (CAGED)", baseString: 6, frets: [3, 2, 0, 2, 3, 3], fingers: [2, 1, 0, 1, 3, 4], rootFretOffset: 3 },
      { name: "Formato de Eadd9 (CAGED)", baseString: 6, frets: [0, 2, 2, 1, 0, 2], fingers: [0, 2, 3, 1, 0, 4] },
      { name: "Formato de Dadd9 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] }
    ]
  },
  'dom9': {
    name: 'Dominante com 9ª (9)',
    shapes: [
      { name: "Formato de C9 (CAGED)", baseString: 5, frets: [-1, 3, 2, 3, 3, 0], fingers: [0, 2, 1, 3, 4, 0], rootFretOffset: 3 },
      { name: "Formato de A9 (CAGED)", baseString: 5, frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 3, 2, 0] },
      { name: "Formato de G9 (CAGED)", baseString: 6, frets: [3, -1, 3, 2, 3, 3], fingers: [1, 0, 3, 2, 4, 4], rootFretOffset: 3 },
      { name: "Formato de E9 (CAGED)", baseString: 6, frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
      { name: "Formato de D9 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] }
    ]
  },
  'maj9': {
    name: 'Maior com 9ª (maj9)',
    shapes: [
      { name: "Formato de Cmaj9 (CAGED)", baseString: 5, frets: [-1, 3, 2, 4, 3, 0], fingers: [0, 2, 1, 4, 3, 0], rootFretOffset: 3 },
      { name: "Formato de Amaj9 (CAGED)", baseString: 5, frets: [-1, 0, 2, 1, 0, 0], fingers: [0, 0, 3, 2, 0, 0] },
      { name: "Formato de Gmaj9 (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 4], rootFretOffset: 3 },
      { name: "Formato de Emaj9 (CAGED)", baseString: 6, frets: [0, 2, 1, 1, 0, 2], fingers: [0, 3, 1, 2, 0, 4] },
      { name: "Formato de Dmaj9 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 2, 0], fingers: [0, 0, 0, 1, 2, 0] }
    ]
  },
  'madd9': {
    name: 'Menor com 9ª (madd9)',
    shapes: [
      { name: "Formato de Cmadd9 (CAGED)", baseString: 5, frets: [-1, 3, 1, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], rootFretOffset: 3 },
      { name: "Formato de Amadd9 (CAGED)", baseString: 5, frets: [-1, 0, 2, 4, 1, 0], fingers: [0, 0, 2, 4, 1, 0] },
      { name: "Formato de Gmadd9 (CAGED)", baseString: 6, frets: [3, 1, 0, 2, 3, 3], fingers: [2, 1, 0, 1, 3, 4], rootFretOffset: 3 },
      { name: "Formato de Emadd9 (CAGED)", baseString: 6, frets: [0, 2, 2, 0, 0, 2], fingers: [0, 2, 3, 0, 0, 4] },
      { name: "Formato de Dmadd9 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] }
    ]
  },
  'm9': {
    name: 'Menor com 7ª e 9ª (m9)',
    shapes: [
      { name: "Formato de Cm9 (CAGED)", baseString: 5, frets: [-1, 3, 1, 3, 3, 0], fingers: [0, 2, 1, 3, 4, 0], rootFretOffset: 3 },
      { name: "Formato de Am9 (CAGED)", baseString: 5, frets: [-1, 0, 2, 4, 1, 3], fingers: [0, 0, 1, 4, 1, 3] },
      { name: "Formato de Gm9 (CAGED)", baseString: 6, frets: [3, 1, 3, 3, 3, 3], fingers: [1, 0, 2, 3, 3, 3], rootFretOffset: 3 },
      { name: "Formato de Em9 (CAGED)", baseString: 6, frets: [0, 2, 0, 0, 0, 2], fingers: [0, 2, 0, 0, 0, 3] },
      { name: "Formato de Dm9 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0] }
    ]
  },
  'dom7add11': {
    name: 'Dominante com 11ª (7(11))',
    shapes: [
      { name: "Formato de C7(11)", baseString: 5, frets: [-1, 3, 3, 3, 1, 1], fingers: [0, 2, 3, 4, 1, 1], rootFretOffset: 3 },
      { name: "Formato de A7(11)", baseString: 5, frets: [-1, 0, 0, 0, 2, 0], fingers: [0, 0, 0, 0, 1, 0] },
      { name: "Formato de G7(11)", baseString: 6, frets: [3, 0, 3, 0, 1, 1], fingers: [3, 0, 4, 0, 1, 2], rootFretOffset: 3 },
      { name: "Formato de E7(11)", baseString: 6, frets: [0, 0, 0, 1, 0, 0], fingers: [0, 0, 0, 1, 0, 0] },
      { name: "Formato de D7(11)", baseString: 4, frets: [-1, -1, 0, 0, 1, 0], fingers: [0, 0, 0, 0, 1, 0] }
    ]
  },
  'dom7add13': {
    name: 'Dominante com 13ª (7(13))',
    shapes: [
      { name: "Formato de C7(13)", baseString: 5, frets: [-1, 3, 2, 3, 5, 5], fingers: [0, 2, 1, 3, 4, 4], rootFretOffset: 3 },
      { name: "Formato de A7(13)", baseString: 5, frets: [-1, 0, 2, 0, 2, 2], fingers: [0, 0, 2, 0, 3, 4] },
      { name: "Formato de G7(13)", baseString: 6, frets: [3, -1, 3, 2, 3, 5], fingers: [1, 0, 2, 1, 3, 4], rootFretOffset: 3 },
      { name: "Formato de E7(13)", baseString: 6, frets: [0, 2, 0, 1, 2, 2], fingers: [0, 2, 0, 1, 3, 4] },
      { name: "Formato de D7(13)", baseString: 4, frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 3, 1, 4] }
    ]
  },
  'dom9add11': {
    name: 'Dominante com 9ª e 11ª (9(11))',
    shapes: [
      { name: "Formato de C9(11)", baseString: 5, frets: [-1, 3, 3, 3, 3, 0], fingers: [0, 1, 1, 1, 1, 0], rootFretOffset: 3 },
      { name: "Formato de A9(11)", baseString: 5, frets: [-1, 0, 0, 0, 0, 0], fingers: [0, 0, 0, 0, 0, 0] },
      { name: "Formato de E9(11)", baseString: 6, frets: [0, 0, 0, 1, 0, 2], fingers: [0, 0, 0, 1, 0, 2] },
    ]
  },
  'dom9add13': {
    name: 'Dominante com 9ª e 13ª (13)',
    shapes: [
      { name: "Formato de C13", baseString: 5, frets: [-1, 3, 2, 3, 5, 5], fingers: [0, 2, 1, 3, 4, 4], rootFretOffset: 3 },
      { name: "Formato de A13", baseString: 5, frets: [-1, 0, 2, 0, 2, 2], fingers: [0, 0, 2, 0, 3, 4] },
      { name: "Formato de E13", baseString: 6, frets: [0, 2, 0, 1, 2, 2], fingers: [0, 2, 0, 1, 3, 4] },
    ]
  }
};

async function migrateShapes() {
  console.log('🔥 Iniciando migração de shapes para Firebase...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [chordType, data] of Object.entries(SHAPES_TO_MIGRATE)) {
    try {
      console.log(`Migrando: ${data.name} (${chordType})...`);
      
      const docRef = doc(db, 'shapes', chordType);
      await setDoc(docRef, {
        name: data.name,
        shapes: data.shapes,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ ${chordType} migrado com sucesso!`);
      successCount++;
    } catch (error) {
      console.error(`❌ Erro ao migrar ${chordType}:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 Resumo da migração:`);
  console.log(`   ✅ Sucesso: ${successCount}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log(`   📦 Total: ${Object.keys(SHAPES_TO_MIGRATE).length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Migração concluída com sucesso!');
  }
}

// Função principal com autenticação
async function main() {
  console.log('🔐 Autenticação necessária para migrar dados.\n');
  
  try {
    const email = await question('Email do admin: ');
    const password = await question('Senha: ');
    
    console.log('\n🔄 Autenticando...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login realizado com sucesso!\n');
    
    rl.close();
    
    // Executar migração
    await migrateShapes();
    
    console.log('\n✨ Processo finalizado. Você pode fechar este script.');
    process.exit(0);
  } catch (error: any) {
    rl.close();
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      console.error('\n❌ Email ou senha incorretos.');
    } else if (error.code === 'auth/user-not-found') {
      console.error('\n❌ Usuário não encontrado. Crie um usuário admin no Firebase Console.');
    } else {
      console.error('\n💥 Erro:', error.message || error);
    }
    process.exit(1);
  }
}

// Executar script
main();

