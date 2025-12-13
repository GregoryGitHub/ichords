import { ScalePattern, ChordFormula, Interval } from './types';

export const CHROMATIC_SCALE = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const INTERVALS_MAP: Record<number, Interval> = {
  0: { semitones: 0, name: 'Tônica', shortName: 'T', quality: 'root' },
  1: { semitones: 1, name: 'Segunda Menor', shortName: 'b2', quality: 'extension' },
  2: { semitones: 2, name: 'Segunda Maior', shortName: '2', quality: 'extension' },
  3: { semitones: 3, name: 'Terça Menor', shortName: 'b3', quality: 'third' },
  4: { semitones: 4, name: 'Terça Maior', shortName: '3', quality: 'third' },
  5: { semitones: 5, name: 'Quarta Justa', shortName: '4', quality: 'extension' },
  6: { semitones: 6, name: 'Quarta Aumentada', shortName: '#4', quality: 'extension' }, // or b5
  7: { semitones: 7, name: 'Quinta Justa', shortName: '5', quality: 'fifth' },
  8: { semitones: 8, name: 'Sexta Menor', shortName: 'b6', quality: 'extension' }, // or #5
  9: { semitones: 9, name: 'Sexta Maior', shortName: '6', quality: 'extension' },
  10: { semitones: 10, name: 'Sétima Menor', shortName: 'b7', quality: 'seventh' },
  11: { semitones: 11, name: 'Sétima Maior', shortName: '7M', quality: 'seventh' },
  13: { semitones: 13, name: 'Nona Menor', shortName: 'b9', quality: 'extension' },
  14: { semitones: 14, name: 'Nona Maior', shortName: '9', quality: 'extension' },
  17: { semitones: 17, name: 'Décima Primeira', shortName: '11', quality: 'extension' },
  18: { semitones: 18, name: 'Décima Primeira Aum.', shortName: '#11', quality: 'extension' },
  21: { semitones: 21, name: 'Décima Terceira', shortName: '13', quality: 'extension' },
};

export const SCALE_PATTERNS: ScalePattern[] = [
  { name: 'Maior Natural', intervals: [0, 2, 4, 5, 7, 9, 11], description: 'A escala fundamental da música ocidental. Transmite alegria e estabilidade.' },
  { name: 'Menor Natural', intervals: [0, 2, 3, 5, 7, 8, 10], description: 'Som melancólico e suave. Relativa da escala maior.' },
  { name: 'Menor Harmônica', intervals: [0, 2, 3, 5, 7, 8, 11], description: 'Característica exótica/árabe devido ao intervalo de 1 tom e meio entre o 6º e 7º grau.' },
  { name: 'Menor Melódica', intervals: [0, 2, 3, 5, 7, 9, 11], description: 'Usada no jazz, possui a sonoridade menor mas com finalização instável.' },
  { name: 'Pentatônica Maior', intervals: [0, 2, 4, 7, 9], description: '5 notas, muito usada em solos de blues e rock.' },
  { name: 'Pentatônica Menor', intervals: [0, 3, 5, 7, 10], description: 'A escala de solo mais comum do rock e blues.' },
];

export const CHORD_FORMULAS: Record<string, ChordFormula> = {
  // Triads
  'major': { name: 'Maior', symbol: '', intervals: [0, 4, 7], description: 'Tônica, Terça Maior e Quinta Justa.' },
  'minor': { name: 'Menor', symbol: 'm', intervals: [0, 3, 7], description: 'Tônica, Terça Menor e Quinta Justa.' },
  'dim': { name: 'Diminuto', symbol: 'dim', intervals: [0, 3, 6], description: 'Tensão. Terça menor e Quinta diminuta.' },
  'aug': { name: 'Aumentado', symbol: 'aug', intervals: [0, 4, 8], description: 'Suspenso e misterioso. Quinta aumentada.' },
  // Tetrads
  'maj7': { name: 'Sétima Maior', symbol: 'maj7', intervals: [0, 4, 7, 11], description: 'Sofisticado, comum no Jazz e MPB.' },
  'm7': { name: 'Menor com Sétima', symbol: 'm7', intervals: [0, 3, 7, 10], description: 'Suave e estável.' },
  'dom7': { name: 'Dominante', symbol: '7', intervals: [0, 4, 7, 10], description: 'Pede resolução. Tensão do trítono.' },
  'm7b5': { name: 'Meio Diminuto', symbol: 'm7(b5)', intervals: [0, 3, 6, 10], description: 'Sensível, usado frequentemente no grau VII.' },
  'dim7': { name: 'Diminuto', symbol: 'dim7', intervals: [0, 3, 6, 9], description: 'Simétrico e muito tenso.' },
};

export const HARMONIC_FIELD_PATTERNS = {
  major: [
    { degree: 'I', type: 'maj7' },
    { degree: 'ii', type: 'm7' },
    { degree: 'iii', type: 'm7' },
    { degree: 'IV', type: 'maj7' },
    { degree: 'V', type: 'dom7' },
    { degree: 'vi', type: 'm7' },
    { degree: 'vii°', type: 'm7b5' },
  ],
  minor: [
    { degree: 'i', type: 'm7' },
    { degree: 'ii°', type: 'm7b5' },
    { degree: 'III', type: 'maj7' },
    { degree: 'iv', type: 'm7' },
    { degree: 'v', type: 'm7' },
    { degree: 'VI', type: 'maj7' },
    { degree: 'VII', type: 'dom7' },
  ]
};
