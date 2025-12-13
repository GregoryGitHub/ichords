import { useState, useEffect, useRef } from 'react';
import { getShapes, ChordShape, clearCache } from '../firebase/shapesService';

/**
 * Hook para buscar shapes do Firebase com fallback para shapes hardcoded
 * Aceita um trigger opcional para forçar recarregamento (ex: quando modal abre)
 */
export const useShapes = (
  chordType: string, 
  fallbackShapes: ChordShape[],
  reloadTrigger?: boolean | number // Trigger para forçar reload
): ChordShape[] => {
  // Armazenar shapes por tipo para evitar mostrar shapes errados
  const [shapesByType, setShapesByType] = useState<Record<string, ChordShape[]>>({
    [chordType]: fallbackShapes
  });
  const [loading, setLoading] = useState(true);
  const previousChordType = useRef<string>(chordType);

  useEffect(() => {
    let isMounted = true;

    const loadShapes = async () => {
      // Se tipo mudou, limpar cache
      if (previousChordType.current !== chordType) {
        clearCache();
        previousChordType.current = chordType;
        
        // Inicializar com fallback imediatamente
        setShapesByType(prev => ({
          ...prev,
          [chordType]: fallbackShapes
        }));
      }

      try {
        const firebaseShapes = await getShapes(chordType);
        
        if (isMounted) {
          if (firebaseShapes.length > 0) {
            setShapesByType(prev => ({
              ...prev,
              [chordType]: firebaseShapes
            }));
          } else {
            // Fallback para shapes hardcoded se não houver no Firebase
            setShapesByType(prev => ({
              ...prev,
              [chordType]: fallbackShapes
            }));
          }
        }
      } catch (error) {
        console.error(`Erro ao carregar shapes do tipo ${chordType}:`, error);
        // Em caso de erro, usar fallback
        if (isMounted) {
          setShapesByType(prev => ({
            ...prev,
            [chordType]: fallbackShapes
          }));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadShapes();

    return () => {
      isMounted = false;
    };
  }, [chordType, reloadTrigger, fallbackShapes]); // Recarrega quando chordType ou reloadTrigger mudar

  // Sempre retornar shapes do tipo correto
  return shapesByType[chordType] || fallbackShapes;
};

