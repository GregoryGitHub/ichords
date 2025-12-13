import { NoteName } from '../types';
import { CHROMATIC_SCALE } from '../constants';

export interface ScalePosition {
  name: string;
  frets: number[][]; // Array de 6 arrays (uma por corda), cada um com as casas da escala
  startFret: number;
  rootFrets: { string: number; fret: number }[]; // Todas as tônicas nessa posição (absolutas)
}

// Afinação padrão da guitarra (índices no CHROMATIC_SCALE)
// E(4), A(9), D(2), G(7), B(11), e(4)
const STANDARD_TUNING = [4, 9, 2, 7, 11, 4]; // [6ª corda (E grave), 5ª, 4ª, 3ª, 2ª, 1ª corda (e agudo)]

interface CagedShape {
  name: string;
  baseString: 6 | 5 | 4; // Corda da tônica do shape (6 = E grave, 5 = A, 4 = D)
  frets: number[]; // Shape relativo [E, A, D, G, B, e]
  rootFretOffset?: number;
}

// Shapes base (CAGED) para acorde maior. Usamos eles como âncora para as posições da escala.
// 0 = corda solta, -1 = não tocar (irrelevante aqui, só para referência do shape)
// Fonte: `components/GuitarChordModal.tsx`
const CAGED_MAJOR_SHAPES: CagedShape[] = [
  { name: 'Posição 1 (C)', baseString: 5, frets: [-1, 3, 2, 0, 1, 0], rootFretOffset: 3 },
  { name: 'Posição 2 (A)', baseString: 5, frets: [-1, 0, 2, 2, 2, 0] },
  { name: 'Posição 3 (G)', baseString: 6, frets: [3, 2, 0, 0, 0, 3], rootFretOffset: 3 },
  { name: 'Posição 4 (E)', baseString: 6, frets: [0, 2, 2, 1, 0, 0] },
  { name: 'Posição 5 (D)', baseString: 4, frets: [-1, -1, 0, 2, 3, 2] },
];

const getOpenStringIndexForBase = (base: 6 | 5 | 4) => {
  // E (Corda 6) = index 4 | A (Corda 5) = index 9 | D (Corda 4) = index 2
  if (base === 5) return 9;
  if (base === 4) return 2;
  return 4;
};

const computeStartFretFromShape = (absoluteFrets: number[]) => {
  const playedFrets = absoluteFrets.filter(f => f > 0);
  const minPlayed = playedFrets.length > 0 ? Math.min(...playedFrets) : 0;
  const hasOpenStrings = absoluteFrets.some(f => f === 0);

  // Para escala, a posição deve ficar ancorada no "box" do shape.
  // Se houver corda solta, mantemos startFret=1 (nut). Caso contrário, usamos a menor casa tocada.
  if (hasOpenStrings) return 1;

  if (playedFrets.length === 0) return 1;

  const maxPlayed = Math.max(...playedFrets);
  let startFret = minPlayed;

  // Garantir que o box tenha 5 casas (start..start+4) cobrindo o shape
  if (maxPlayed - startFret > 4) {
    startFret = maxPlayed - 4;
  }

  return Math.max(1, startFret);
};

const findScaleFretsInWindow = (stringRootIndex: number, scaleNoteIndices: number[], startAbs: number, endAbs: number) => {
  const frets: number[] = [];
  for (let fret = startAbs; fret <= endAbs; fret++) {
    const noteIndex = (stringRootIndex + fret) % 12;
    if (scaleNoteIndices.includes(noteIndex)) frets.push(fret);
  }
  return frets;
};

// Gera as 5 posições CAGED de uma escala
export const generateScalePositions = (root: NoteName, scaleNotes: NoteName[]): ScalePosition[] => {
  const rootIndex = CHROMATIC_SCALE.indexOf(root);

  // Converter notas da escala para índices
  const scaleNoteIndices = scaleNotes
    .map(note => CHROMATIC_SCALE.indexOf(note))
    .filter(i => i >= 0);

  // Caso defensivo
  if (rootIndex < 0 || scaleNoteIndices.length === 0) return [];

  return CAGED_MAJOR_SHAPES.map(shape => {
    const openStringIndex = getOpenStringIndexForBase(shape.baseString);
    const rootOffset = shape.rootFretOffset || 0;
    const shapeRootIndex = (openStringIndex + rootOffset) % 12;

    // Shift necessário para transformar a tônica do shape original na tônica desejada
    const shift = (rootIndex - shapeRootIndex + 12) % 12;

    // Casas absolutas do shape (usadas só para definir a região/box)
    const absoluteShapeFrets = shape.frets.map(f => (f === -1 ? -1 : f + shift));
    const startFret = computeStartFretFromShape(absoluteShapeFrets);

    const startAbs = startFret === 1 ? 0 : startFret;
    const endAbs = startAbs + 4;

    const frets = STANDARD_TUNING.map(stringRoot =>
      findScaleFretsInWindow(stringRoot, scaleNoteIndices, startAbs, endAbs)
    );

    const rootFrets = frets
      .map((stringFrets, stringIndex) =>
        stringFrets
          .filter(f => ((STANDARD_TUNING[stringIndex] + f) % 12) === rootIndex)
          .map(f => ({ string: stringIndex, fret: f }))
      )
      .flat();

    return {
      name: shape.name,
      frets,
      startFret,
      rootFrets,
    };
  });
};

// Helper para obter o nome da nota em uma casa específica de uma corda
export const getNoteAtFret = (stringIndex: number, fret: number): NoteName => {
  const stringRootIndex = STANDARD_TUNING[stringIndex];
  const noteIndex = (stringRootIndex + fret) % 12;
  return CHROMATIC_SCALE[noteIndex];
};

