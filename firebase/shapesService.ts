import { db } from './config';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

export interface ChordShape {
  name?: string;
  baseString: 6 | 5 | 4;
  frets: number[];
  fingers?: number[];
  rootFretOffset?: number;
}

export interface ShapeDocument {
  name: string;
  shapes: ChordShape[];
  updatedAt?: any;
}

const SHAPES_COLLECTION = 'shapes';

// Cache local para performance
const shapesCache = new Map<string, ShapeDocument>();

/**
 * Busca os shapes de um tipo específico de acorde
 */
export const getShapes = async (chordType: string): Promise<ChordShape[]> => {
  try {
    // Verificar cache primeiro
    if (shapesCache.has(chordType)) {
      return shapesCache.get(chordType)!.shapes;
    }

    // Buscar do Firestore
    const docRef = doc(db, SHAPES_COLLECTION, chordType);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ShapeDocument;
      shapesCache.set(chordType, data);
      return data.shapes;
    }

    return [];
  } catch (error) {
    console.error(`Erro ao buscar shapes do tipo ${chordType}:`, error);
    return [];
  }
};

/**
 * Atualiza os shapes de um tipo específico de acorde
 */
export const updateShapes = async (
  chordType: string, 
  shapes: ChordShape[],
  name: string
): Promise<void> => {
  try {
    const docRef = doc(db, SHAPES_COLLECTION, chordType);
    const data: ShapeDocument = {
      name,
      shapes,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, data);
    
    // Atualizar cache
    shapesCache.set(chordType, data);
    
    console.log(`Shapes do tipo ${chordType} atualizados com sucesso!`);
  } catch (error) {
    console.error(`Erro ao atualizar shapes do tipo ${chordType}:`, error);
    throw error;
  }
};

/**
 * Busca todos os tipos de shapes disponíveis
 */
export const getAllShapeTypes = async (): Promise<Array<{ id: string; data: ShapeDocument }>> => {
  try {
    const shapesQuery = query(
      collection(db, SHAPES_COLLECTION),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(shapesQuery);
    const results: Array<{ id: string; data: ShapeDocument }> = [];

    querySnapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        data: doc.data() as ShapeDocument
      });
      
      // Atualizar cache
      shapesCache.set(doc.id, doc.data() as ShapeDocument);
    });

    return results;
  } catch (error) {
    console.error('Erro ao buscar todos os tipos de shapes:', error);
    return [];
  }
};

/**
 * Limpa o cache local (útil após atualizações)
 */
export const clearCache = (): void => {
  shapesCache.clear();
};

