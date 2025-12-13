export type NoteName = string;

export interface Interval {
  semitones: number;
  name: string; // e.g., "Terça Maior"
  shortName: string; // e.g., "3M"
  quality?: 'root' | 'third' | 'fifth' | 'seventh' | 'extension';
}

export interface ScalePattern {
  name: string;
  intervals: number[]; // Sequence of semitones from root (e.g. Major: [0, 2, 4, 5, 7, 9, 11])
  description: string;
}

export interface ChordFormula {
  name: string;
  symbol: string;
  intervals: number[]; // Semitones from root
  description: string;
}

export interface Scale {
  root: NoteName;
  type: string;
  notes: NoteName[];
  intervals: Interval[];
}

export interface Chord {
  root: NoteName;
  symbol: string;
  detailedName: string;
  notes: NoteName[];
  intervals: Interval[];
}

export enum PageView {
  SCALES = 'scales',
  CHORDS = 'chords',
  HARMONY = 'harmony'
}
