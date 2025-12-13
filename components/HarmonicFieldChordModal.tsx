import React, { useMemo, useState, useEffect } from 'react';
import { NoteName, Chord } from '../types';
import { CHROMATIC_SCALE } from '../constants';
import { X } from 'lucide-react';
import { ChromaticLine } from './ChromaticLine';
import { useShapes } from '../hooks/useShapes';

interface HarmonicFieldChordModalProps {
  isOpen: boolean;
  onClose: () => void;
  chord: Chord;
  degree: string;
}

// Definição dos Shapes (Formatos) baseados no sistema CAGED
// Reutilizando a mesma estrutura do GuitarChordModal
interface ChordShape {
  name?: string;
  baseString: 6 | 5 | 4;
  frets: number[];
  fingers?: number[];
  rootFretOffset?: number;
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
  'dom7': [
    { name: "Formato de C7 (CAGED)", baseString: 5, frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], rootFretOffset: 3 },
    { name: "Formato de A7 (CAGED)", baseString: 5, frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] },
    { name: "Formato de G7 (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], rootFretOffset: 3 },
    { name: "Formato de E7 (CAGED)", baseString: 6, frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
    { name: "Formato de D7 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }
  ],
  'maj7': [
    { name: "Formato de Cmaj7 (CAGED)", baseString: 5, frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], rootFretOffset: 3 },
    { name: "Formato de Amaj7 (CAGED)", baseString: 5, frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1] },
    { name: "Formato de Gmaj7 (CAGED)", baseString: 6, frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 4], rootFretOffset: 3 },
    { name: "Formato de Emaj7 (CAGED)", baseString: 6, frets: [0, -1, 1, 1, 0, -1], fingers: [1, 0, 3, 4, 2, 0] },
    { name: "Formato de Dmaj7 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] }
  ],
  'm7': [
    { name: "Formato de Cm7 (CAGED)", baseString: 5, frets: [-1, 3, 1, 0, 1, 0], fingers: [0, 3, 1, 0, 2, 0], rootFretOffset: 3 },
    { name: "Formato de Am7 (CAGED)", baseString: 5, frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] },
    { name: "Formato de Gm7 (CAGED)", baseString: 6, frets: [3, 1, 0, 0, 0, 1], fingers: [3, 1, 0, 0, 0, 2], rootFretOffset: 3 },
    { name: "Formato de Em7 (CAGED)", baseString: 6, frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
    { name: "Formato de Dm7 (CAGED)", baseString: 4, frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] }
  ],
  'm7b5': [
    { name: "Formato de Cm7b5 (CAGED)", baseString: 5, frets: [-1, 3, 1, 0, 1, -1], fingers: [0, 3, 1, 0, 2, 0], rootFretOffset: 3 },
    { name: "Formato de Am7b5 (CAGED)", baseString: 5, frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 1, 2, 1, 3, 0] },
    { name: "Formato de Gm7b5 (CAGED)", baseString: 6, frets: [3, 1, 0, 0, -1, 1], fingers: [3, 1, 0, 0, 0, 2], rootFretOffset: 3 },
    { name: "Formato de Em7b5 (CAGED)", baseString: 6, frets: [0, -1, 0, 0, -1, -1], fingers: [1, 0, 2, 3, 0, 0] },
    { name: "Formato de Dm7b5 (CAGED)", baseString: 4, frets: [-1, -1, 0, 1, 1, 1], fingers: [0, 0, 0, 1, 2, 3] }
  ],
  'dim7': [
    { name: "Formato Diminuto", baseString: 5, frets: [-1, 0, 1, -1, 1, -1], fingers: [0, 1, 2, 0, 3, 0] } 
  ],
  'dim': [
     { name: "Tríade Diminuta", baseString: 5, frets: [-1, 0, 1, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] } 
  ],
  'aug': [
     { name: "Aumentado", baseString: 6, frets: [0, -1, 2, 1, 1, -1], fingers: [1, 0, 3, 2, 2, 0] } 
  ]
};

// Helper para calcular o diagrama de um shape específico
const calculateChordDiagram = (root: NoteName, shape: ChordShape) => {
  const rootIndex = CHROMATIC_SCALE.indexOf(root);
  
  // Calcula o deslocamento (offset) da pestana/tônica
  let openStringIndex = 4; // E (Corda 6)
  if (shape.baseString === 5) openStringIndex = 9; // A (Corda 5)
  if (shape.baseString === 4) openStringIndex = 2; // D (Corda 4)

  const rootOffset = shape.rootFretOffset || 0;
  const shapeRootIndex = (openStringIndex + rootOffset) % 12;

  // Shift necessário para transformar a tônica do shape original na tônica desejada
  let shift = (rootIndex - shapeRootIndex + 12) % 12;

  // Calcula as casas reais
  const absoluteFrets = shape.frets.map(f => {
    if (f === -1) return -1;
    return f + shift;
  });

  // Determina a casa inicial do desenho
  const playedFrets = absoluteFrets.filter(f => f > 0);
  const minPlayed = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
  
  const hasOpenStrings = absoluteFrets.some(f => f === 0);
  let startFret = minPlayed > 0 ? minPlayed : 1;
  
  if (hasOpenStrings) {
    startFret = 1;
  } else {
    if (Math.max(...absoluteFrets) <= 5) startFret = 1;
  }

  // Normaliza para o desenho
  const displayFrets = absoluteFrets.map(f => {
    if (f === -1) return -1;
    if (f === 0) return 0;
    return f - startFret + 1;
  });

  return {
    frets: displayFrets,
    startFret,
    fingers: shape.fingers,
    shapeName: shape.name
  };
};

// Helper para determinar o tipo de acorde a partir do símbolo
const getChordTypeFromSymbol = (symbol: string): string => {
  // Verificar na ordem específica (mais específico primeiro)
  if (symbol.includes('maj7')) return 'maj7';
  if (symbol.includes('m7(b5)') || symbol.includes('m7b5')) return 'm7b5';
  if (symbol.includes('dim7')) return 'dim7';
  if (symbol.includes('dim')) return 'dim';
  if (symbol.includes('aug')) return 'aug';
  // Verificar m7 antes de m (para não pegar m7 como minor)
  if (symbol.includes('m7')) return 'm7';
  // Verificar 7 antes de m (para não pegar m7 como dom7)
  if (symbol.includes('7')) return 'dom7';
  if (symbol.includes('m') && !symbol.includes('maj')) return 'minor';
  return 'major';
};

// Componente para renderizar um diagrama SVG
const ChordDiagram: React.FC<{ config: ReturnType<typeof calculateChordDiagram> }> = ({ config }) => {
  const NUM_STRINGS = 6;
  const NUM_FRETS = 5;
  const STRING_SPACING = 20;
  const FRET_SPACING = 28;
  const MARGIN_X = 25;
  const MARGIN_Y = 25;
  const SVG_WIDTH = 150;
  const SVG_HEIGHT = 180;

  return (
    <div className="relative bg-white rounded-lg p-2 shadow-lg">
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
        <defs>
          <filter id={`shadow-${config.shapeName}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Casa Inicial Indicador */}
        {config.startFret > 1 && (
          <text x={MARGIN_X - 8} y={MARGIN_Y + FRET_SPACING / 1.5} textAnchor="end" className="fill-slate-500 text-xs font-bold font-sans">
            {config.startFret}ª
          </text>
        )}

        {/* NUT */}
        {config.startFret === 1 && (
          <rect x={MARGIN_X} y={MARGIN_Y} width={STRING_SPACING * 5} height={4} fill="#334155" />
        )}

        {/* Frets */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={MARGIN_X}
            y1={MARGIN_Y + i * FRET_SPACING + (config.startFret === 1 ? 4 : 0)}
            x2={MARGIN_X + STRING_SPACING * 5}
            y2={MARGIN_Y + i * FRET_SPACING + (config.startFret === 1 ? 4 : 0)}
            stroke="#94a3b8"
            strokeWidth={i === 0 && config.startFret > 1 ? 2 : 1}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: NUM_STRINGS }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={MARGIN_X + i * STRING_SPACING}
            y1={MARGIN_Y}
            x2={MARGIN_X + i * STRING_SPACING}
            y2={MARGIN_Y + NUM_FRETS * FRET_SPACING}
            stroke="#475569"
            strokeWidth={i > 2 ? 1 : 1.5}
          />
        ))}

        {/* Dots e Indicadores */}
        {config.frets.map((fret, stringIndex) => {
          const x = MARGIN_X + stringIndex * STRING_SPACING;
          
          if (fret === -1) {
            return (
              <text key={`x-${stringIndex}`} x={x} y={MARGIN_Y - 8} textAnchor="middle" className="fill-slate-400 text-[10px] font-sans font-bold">X</text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={`o-${stringIndex}`} cx={x} cy={MARGIN_Y - 12} r={3} fill="none" stroke="#64748b" strokeWidth={1.5} />
            );
          }

          const y = MARGIN_Y + (fret - 0.5) * FRET_SPACING + (config.startFret === 1 ? 4 : 0);
          
          return (
            <g key={`dot-${stringIndex}`}>
              <circle 
                cx={x} 
                cy={y} 
                r={8} 
                className="fill-brand-600"
                filter={`url(#shadow-${config.shapeName})`}
              />
              {config.fingers && config.fingers[stringIndex] > 0 && (
                <text x={x} y={y + 3} textAnchor="middle" className="fill-white text-[10px] font-bold font-sans">
                  {config.fingers[stringIndex]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const HarmonicFieldChordModal: React.FC<HarmonicFieldChordModalProps> = ({ 
  isOpen, 
  onClose, 
  chord,
  degree 
}) => {
  const [openTimestamp, setOpenTimestamp] = useState(0);

  const chordType = getChordTypeFromSymbol(chord.symbol);

  // Atualizar timestamp quando modal abre OU quando tipo de acorde muda
  useEffect(() => {
    if (isOpen) {
      setOpenTimestamp(Date.now());
    }
  }, [isOpen, chordType]);
  
  // Buscar shapes do Firebase com fallback para shapes hardcoded
  // Usa timestamp + chordType para garantir reload correto
  const fallbackShapes = SHAPES[chordType] || SHAPES['major'];
  const shapes = useShapes(chordType, fallbackShapes, openTimestamp);

  const chordDiagrams = useMemo(() => {
    return shapes.map(shape => calculateChordDiagram(chord.root, shape));
  }, [chord.root, shapes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl relative flex flex-col p-6 max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-slate-500 font-serif italic text-lg">{degree}</span>
            <h2 className="text-4xl font-bold text-brand-400">{chord.symbol}</h2>
          </div>
          <p className="text-sm text-slate-400">{chord.detailedName}</p>
        </div>

        {/* Chromatic Line */}
        <div className="mb-6">
          <ChromaticLine root={chord.root} activeIntervals={chord.intervals} />
        </div>

        {/* CAGED Shapes Grid */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-4 text-center">Formas CAGED</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {chordDiagrams.map((diagram, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <ChordDiagram config={diagram} />
                <p className="text-xs text-slate-400 mt-2 text-center px-2">
                  {diagram.shapeName}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center leading-tight px-4 mt-4">
          Os 5 formatos CAGED permitem tocar o mesmo acorde em diferentes posições do braço.
        </p>

      </div>
    </div>
  );
};

