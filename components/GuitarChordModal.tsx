import React, { useMemo, useState, useEffect } from 'react';
import { NoteName } from '../types';
import { CHROMATIC_SCALE } from '../constants';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GuitarChordModalProps {
  isOpen: boolean;
  onClose: () => void;
  root: NoteName;
  chordType: string; // key from CHORD_FORMULAS
  chordSymbol: string;
}

// Definição dos Shapes (Formatos) baseados no sistema CAGED
// 0 = corda solta (ou pestana), -1 = não tocar (X)
// fingers: indicação sugerida de dedos (0 para solta/pestana)
interface ChordShape {
  name?: string; // Ex: "Formato de E", "Formato de A"
  baseString: 6 | 5 | 4; // Corda da tônica (6 = Mizona, 5 = Lá, 4 = Ré)
  frets: number[]; // Deslocamento relativo à tônica [E, A, D, G, B, e]
  fingers?: number[]; // Dedos sugeridos [E, A, D, G, B, e]
  rootFretOffset?: number; // Quantas casas a tônica está deslocada da corda solta no shape original (ex: C shape = 3)
}

const SHAPES: Record<string, ChordShape[]> = {
  'major': [
    { name: "Formato de C (CAGED)", baseString: 5, frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], rootFretOffset: 3 },
    { name: "Formato de A (CAGED)", baseString: 5, frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] },
    { name: "Formato de G (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], rootFretOffset: 3 },
    { name: "Formato de E (CAGED)", baseString: 6, frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] }, 
    { name: "Formato de D (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
  ],
  'minor': [
    { name: "Formato de Em", baseString: 6, frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] }, 
    { name: "Formato de Am", baseString: 5, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] },
    { name: "Formato de Dm", baseString: 4, frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 4, 1] }
  ],
  'dom7': [ // 7
    { name: "Formato de C7", baseString: 5, frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], rootFretOffset: 3 },
    { name: "Formato de E7", baseString: 6, frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] }, 
    { name: "Formato de A7", baseString: 5, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] } 
  ],
  'maj7': [
    { name: "Formato de Cmaj7", baseString: 5, frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], rootFretOffset: 3 },
    { name: "Formato de Emaj7", baseString: 6, frets: [0, -1, 1, 1, 0, -1], fingers: [1, 0, 3, 4, 2, 0] }, 
    { name: "Formato de Amaj7", baseString: 5, frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1] } 
  ],
  'm7': [
    { name: "Formato de Em7", baseString: 6, frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] }, 
    { name: "Formato de Am7", baseString: 5, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] } 
  ],
  'm7b5': [ // Meio diminuto
    { name: "Formato 6ª Corda", baseString: 6, frets: [0, -1, 0, 0, -1, -1], fingers: [1, 0, 2, 3, 0, 0] }, 
    { name: "Formato 5ª Corda", baseString: 5, frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 1, 2, 1, 3, 0] } 
  ],
  'dim7': [ // Diminuto completo
    { name: "Formato Diminuto", baseString: 5, frets: [-1, 0, 1, -1, 1, -1], fingers: [0, 1, 2, 0, 3, 0] } 
  ],
  'dim': [ // Tríade diminuta
     { name: "Tríade Diminuta", baseString: 5, frets: [-1, 0, 1, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] } 
  ],
  'aug': [
     { name: "Aumentado", baseString: 6, frets: [0, -1, 2, 1, 1, -1], fingers: [1, 0, 3, 2, 2, 0] } 
  ]
};

export const GuitarChordModal: React.FC<GuitarChordModalProps> = ({ isOpen, onClose, root, chordType, chordSymbol }) => {
  const [variationIndex, setVariationIndex] = useState(0);

  // Reset variation when chord changes
  useEffect(() => {
    setVariationIndex(0);
  }, [root, chordType, isOpen]);

  // Lógica para calcular as casas (frets)
  const chordConfig = useMemo(() => {
    if (!root) return null;

    const rootIndex = CHROMATIC_SCALE.indexOf(root);
    
    // Tenta encontrar shapes disponíveis para o tipo
    let shapes = SHAPES[chordType] || SHAPES['major']; 
    
    // Garante que o index é válido (loop circular)
    const validIndex = Math.abs(variationIndex) % shapes.length;
    const selectedShape = shapes[validIndex];

    // Calcula o deslocamento (offset) da pestana/tônica
    // E (Corda 6) = index 4 | A (Corda 5) = index 9 | D (Corda 4) = index 2
    let openStringIndex = 4;
    if (selectedShape.baseString === 5) openStringIndex = 9;
    if (selectedShape.baseString === 4) openStringIndex = 2;

    const rootOffset = selectedShape.rootFretOffset || 0;
    const shapeRootIndex = (openStringIndex + rootOffset) % 12;

    // Shift necessario para transformar a tônica do shape original na tônica desejada
    let shift = (rootIndex - shapeRootIndex + 12) % 12;

    // Calcula as casas reais
    const absoluteFrets = selectedShape.frets.map(f => {
      if (f === -1) return -1; // Mute
      return f + shift;
    });

    // Determina a casa inicial do desenho (minFret) para desenhar o diagrama
    const playedFrets = absoluteFrets.filter(f => f > 0);
    const minPlayed = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
    
    // Se o acorde for muito longe, o diagrama começa lá
    // Se o acorde tiver cordas soltas (0), startFret tem que ser 1 para aparecer o Nut
    const hasOpenStrings = absoluteFrets.some(f => f === 0);
    let startFret = minPlayed > 0 ? minPlayed : 1;
    
    if (hasOpenStrings) {
        startFret = 1;
    } else {
        // Se todas as notas forem em casas altas, move o diagrama
        // Mas se o acorde couber nas primeiras 5 casas, mantem startFret 1
        if (Math.max(...absoluteFrets) <= 5) startFret = 1;
    }

    // Normaliza para o desenho (0 = solta, 1..5 = casas relativas ao startFret)
    const displayFrets = absoluteFrets.map(f => {
      if (f === -1) return -1;
      if (f === 0) return 0; 
      
      // Se startFret for 1, as casas são literais (ex: casa 3 = desenha na 3)
      // Se startFret for 5, casa 5 = desenha na 1 (top slot)
      return f - startFret + 1;
    });

    return {
      frets: displayFrets,
      startFret,
      fingers: selectedShape.fingers,
      shapeName: selectedShape.name,
      totalVariations: shapes.length,
      currentIndex: validIndex
    };

  }, [root, chordType, variationIndex]);

  if (!isOpen || !chordConfig) return null;

  // Constantes de desenho
  const NUM_STRINGS = 6;
  const NUM_FRETS = 5;
  const STRING_SPACING = 28; // Reduzido levemente
  const FRET_SPACING = 36;   // Reduzido levemente
  const MARGIN_X = 35;
  const MARGIN_Y = 35;
  const SVG_WIDTH = 210;
  const SVG_HEIGHT = 240;

  const nextVariation = () => setVariationIndex(prev => prev + 1);
  const prevVariation = () => setVariationIndex(prev => prev - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-[340px] relative flex flex-col items-center p-5 max-h-[85vh] overflow-y-auto no-scrollbar">
        
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>

        <div className="text-center mt-2 mb-4 w-full">
           <h2 className="text-3xl font-bold text-brand-400">{chordSymbol}</h2>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between w-full px-2 mb-2 bg-slate-800/50 p-2 rounded-lg">
          <button 
            onClick={prevVariation}
            className="p-2 rounded-full bg-slate-800 text-brand-500 hover:bg-slate-700 disabled:opacity-50"
            disabled={chordConfig.totalVariations <= 1}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
             <span className="text-slate-200 text-xs font-semibold text-center">
               {chordConfig.shapeName}
             </span>
             <span className="text-slate-500 text-[10px] uppercase mt-0.5">
               {chordConfig.currentIndex + 1} / {chordConfig.totalVariations}
             </span>
          </div>

          <button 
            onClick={nextVariation}
            className="p-2 rounded-full bg-slate-800 text-brand-500 hover:bg-slate-700 disabled:opacity-50"
            disabled={chordConfig.totalVariations <= 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Diagrama SVG */}
        <div className="relative bg-white rounded-lg p-2 shadow-lg mb-2">
           <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
              {/* Defs para sombras */}
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* Casa Inicial Indicador (ex: 5ª casa) */}
              {chordConfig.startFret > 1 && (
                <text x={MARGIN_X - 12} y={MARGIN_Y + FRET_SPACING / 1.5} textAnchor="end" className="fill-slate-500 text-sm font-bold font-sans">
                  {chordConfig.startFret}ª
                </text>
              )}

              {/* NUT (Pestana superior) */}
              {chordConfig.startFret === 1 && (
                <rect x={MARGIN_X} y={MARGIN_Y} width={STRING_SPACING * 5} height={5} fill="#334155" />
              )}

              {/* Frets (Linhas Horizontais) */}
              {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
                <line
                  key={`fret-${i}`}
                  x1={MARGIN_X}
                  y1={MARGIN_Y + i * FRET_SPACING + (chordConfig.startFret === 1 ? 5 : 0)}
                  x2={MARGIN_X + STRING_SPACING * 5}
                  y2={MARGIN_Y + i * FRET_SPACING + (chordConfig.startFret === 1 ? 5 : 0)}
                  stroke="#94a3b8"
                  strokeWidth={i === 0 && chordConfig.startFret > 1 ? 2 : 1} // Top line slightly thicker if not nut
                />
              ))}

              {/* Strings (Linhas Verticais) */}
              {Array.from({ length: NUM_STRINGS }).map((_, i) => (
                <line
                  key={`string-${i}`}
                  x1={MARGIN_X + i * STRING_SPACING}
                  y1={MARGIN_Y}
                  x2={MARGIN_X + i * STRING_SPACING}
                  y2={MARGIN_Y + NUM_FRETS * FRET_SPACING}
                  stroke="#475569"
                  strokeWidth={i > 2 ? 1 : 1.5} // Cordas graves mais grossas
                />
              ))}

              {/* Dots e Indicadores Superiores (X / O) */}
              {chordConfig.frets.map((fret, stringIndex) => {
                // stringIndex 0 = Low E (esquerda no diagrama)
                const x = MARGIN_X + stringIndex * STRING_SPACING;
                
                // Indicadores X ou O acima do nut
                if (fret === -1) {
                  return (
                    <text key={`x-${stringIndex}`} x={x} y={MARGIN_Y - 10} textAnchor="middle" className="fill-slate-400 text-xs font-sans font-bold">X</text>
                  );
                }
                if (fret === 0) {
                  // Corda solta mas tocada
                  return (
                    <circle key={`o-${stringIndex}`} cx={x} cy={MARGIN_Y - 14} r={4} fill="none" stroke="#64748b" strokeWidth={2} />
                  );
                }

                // Bolinha no braço
                const y = MARGIN_Y + (fret - 0.5) * FRET_SPACING + (chordConfig.startFret === 1 ? 5 : 0);
                
                return (
                  <g key={`dot-${stringIndex}`}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={10} 
                      className="fill-brand-600"
                      filter="url(#shadow)"
                    />
                    {/* Dedo sugerido (se houver) */}
                    {chordConfig.fingers && chordConfig.fingers[stringIndex] > 0 && (
                       <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-xs font-bold font-sans">
                         {chordConfig.fingers[stringIndex]}
                       </text>
                    )}
                  </g>
                );
              })}

           </svg>
        </div>

        <p className="text-[10px] text-slate-500 text-center leading-tight px-4">
          O diagrama mostra onde posicionar os dedos no braço do instrumento.
        </p>

      </div>
    </div>
  );
};
