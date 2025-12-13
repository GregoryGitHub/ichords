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
}

const SHAPES: Record<string, ChordShape[]> = {
  'major': [
    { name: "Formato de E (6ª Corda)", baseString: 6, frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] }, 
    { name: "Formato de A (5ª Corda)", baseString: 5, frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] },
    { name: "Formato de D (4ª Corda)", baseString: 4, frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
  ],
  'minor': [
    { name: "Formato de Em (6ª Corda)", baseString: 6, frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] }, 
    { name: "Formato de Am (5ª Corda)", baseString: 5, frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] },
    { name: "Formato de Dm (4ª Corda)", baseString: 4, frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 4, 1] }
  ],
  'dom7': [ // 7
    { name: "Formato de E7", baseString: 6, frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] }, 
    { name: "Formato de A7", baseString: 5, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] } 
  ],
  'maj7': [
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
    let shapes = SHAPES[chordType] || SHAPES['major']; // Fallback para maior
    
    // Garante que o index é válido (loop circular)
    const validIndex = Math.abs(variationIndex) % shapes.length;
    const selectedShape = shapes[validIndex];

    // Calcula o deslocamento (offset) da pestana/tônica
    // E (Corda 6) = index 4 | A (Corda 5) = index 9 | D (Corda 4) = index 2
    let openStringIndex = 4;
    if (selectedShape.baseString === 5) openStringIndex = 9;
    if (selectedShape.baseString === 4) openStringIndex = 2;

    let fretOffset = (rootIndex - openStringIndex + 12) % 12;

    // Calcula as casas reais
    const absoluteFrets = selectedShape.frets.map(f => {
      if (f === -1) return -1; // Mute
      return f + fretOffset;
    });

    // Determina a casa inicial do desenho (minFret) para desenhar o diagrama
    const playedFrets = absoluteFrets.filter(f => f > 0);
    const minPlayed = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
    
    // Se o acorde for muito longe, o diagrama começa lá
    let startFret = minPlayed > 0 ? minPlayed : 1;
    
    // Ajuste para caber o desenho em 5 casas
    if (Math.max(...absoluteFrets) <= 5) startFret = 1;

    // Normaliza para o desenho (0 = solta, 1..5 = casas relativas ao startFret)
    const displayFrets = absoluteFrets.map(f => {
      if (f === -1) return -1;
      if (f === 0) return 0; // Corda solta sempre aparece acima do nut
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
  const STRING_SPACING = 30;
  const FRET_SPACING = 40;
  const MARGIN_X = 40;
  const MARGIN_Y = 40;

  const nextVariation = () => setVariationIndex(prev => prev + 1);
  const prevVariation = () => setVariationIndex(prev => prev - 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center p-6">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-4xl font-bold text-brand-400 mb-1">{chordSymbol}</h2>
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-4 mb-4 mt-2">
          <button 
            onClick={prevVariation}
            className="p-1 rounded-full bg-slate-800 text-brand-500 hover:bg-slate-700 disabled:opacity-50"
            disabled={chordConfig.totalVariations <= 1}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
             <span className="text-slate-300 text-xs font-semibold">
               {chordConfig.shapeName}
             </span>
             <span className="text-slate-600 text-[10px] uppercase">
               Opção {chordConfig.currentIndex + 1} de {chordConfig.totalVariations}
             </span>
          </div>

          <button 
            onClick={nextVariation}
            className="p-1 rounded-full bg-slate-800 text-brand-500 hover:bg-slate-700 disabled:opacity-50"
            disabled={chordConfig.totalVariations <= 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Diagrama SVG */}
        <div className="relative bg-white rounded-lg p-2 shadow-lg transition-all duration-300">
           <svg width={230} height={260} viewBox="0 0 230 260">
              {/* Defs para sombras */}
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.3"/>
                </filter>
              </defs>

              {/* Casa Inicial Indicador (ex: 5ª casa) */}
              {chordConfig.startFret > 1 && (
                <text x={MARGIN_X - 15} y={MARGIN_Y + FRET_SPACING / 1.5} textAnchor="end" className="fill-slate-500 text-sm font-bold font-sans">
                  {chordConfig.startFret}ª
                </text>
              )}

              {/* NUT (Pestana superior) */}
              {chordConfig.startFret === 1 && (
                <rect x={MARGIN_X} y={MARGIN_Y} width={STRING_SPACING * 5} height={6} fill="#334155" />
              )}

              {/* Frets (Linhas Horizontais) */}
              {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
                <line
                  key={`fret-${i}`}
                  x1={MARGIN_X}
                  y1={MARGIN_Y + i * FRET_SPACING + (chordConfig.startFret === 1 ? 6 : 0)}
                  x2={MARGIN_X + STRING_SPACING * 5}
                  y2={MARGIN_Y + i * FRET_SPACING + (chordConfig.startFret === 1 ? 6 : 0)}
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
                    <circle key={`o-${stringIndex}`} cx={x} cy={MARGIN_Y - 14} r={5} fill="none" stroke="#64748b" strokeWidth={2} />
                  );
                }

                // Bolinha no braço
                const y = MARGIN_Y + (fret - 0.5) * FRET_SPACING + (chordConfig.startFret === 1 ? 6 : 0);
                
                return (
                  <g key={`dot-${stringIndex}`}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={11} 
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

        <p className="mt-4 text-xs text-slate-500 text-center max-w-[200px]">
          * Pressione as setas para ver outras variações de digitação.
        </p>

      </div>
    </div>
  );
};
