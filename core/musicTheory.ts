import { CHROMATIC_SCALE, INTERVALS_MAP, SCALE_PATTERNS, CHORD_FORMULAS, HARMONIC_FIELD_PATTERNS } from '../constants';
import { NoteName, Interval, Scale, Chord, ScalePattern } from '../types';

// Helper to handle circular indexing of the chromatic scale
const getNoteAtOffset = (root: NoteName, semitones: number): NoteName => {
  const rootIndex = CHROMATIC_SCALE.indexOf(root);
  if (rootIndex === -1) return root; // Fallback
  const targetIndex = (rootIndex + semitones) % 12;
  return CHROMATIC_SCALE[targetIndex];
};

// Generate Scale Data
export const generateScale = (root: NoteName, patternName: string): Scale => {
  const pattern = SCALE_PATTERNS.find(p => p.name === patternName) || SCALE_PATTERNS[0];
  const intervals: Interval[] = pattern.intervals.map(semitone => INTERVALS_MAP[semitone]);
  const notes = pattern.intervals.map(semitone => getNoteAtOffset(root, semitone));

  return {
    root,
    type: pattern.name,
    notes,
    intervals
  };
};

// Generate Chord Data
export const generateChord = (
  root: NoteName, 
  baseType: string, 
  extensions: number[] = [] // Array of extra semitones (e.g. 14 for 9th)
): Chord => {
  const formula = CHORD_FORMULAS[baseType];
  
  // Combine base intervals with extension intervals
  // We use a Set to avoid duplicates if user selects something weird, though UI should prevent it
  const allSemitones = Array.from(new Set([...formula.intervals, ...extensions])).sort((a, b) => a - b);
  
  const intervals: Interval[] = allSemitones.map(semitone => {
    // Handle intervals > 12 by mapping them to their simple interval for naming if needed
    // or keep extended map in constants.
    return INTERVALS_MAP[semitone] || { semitones: semitone, name: 'Extensão', shortName: 'Ext', quality: 'extension' };
  });

  const notes = allSemitones.map(semitone => getNoteAtOffset(root, semitone));

  // Build Symbol
  let symbol = root + formula.symbol;
  
  // Naive extension naming logic for MVP
  // If base is C7 and we add 9 (14 semitones), it becomes C9 usually
  const has7 = formula.intervals.includes(10) || formula.intervals.includes(11);
  const has9 = extensions.includes(14);
  const has11 = extensions.includes(17);
  const has13 = extensions.includes(21);

  let extString = "";
  if (has9) extString = "9";
  if (has11) extString = extString ? `${extString},11` : "11";
  if (has13) extString = extString ? `${extString},13` : "13";

  // Specialized naming replacement (Basic implementation)
  if (baseType === 'dom7' && has9 && !has11 && !has13) symbol = root + "9";
  else if (extString) symbol += `(${extString})`;

  return {
    root,
    symbol,
    detailedName: `${root} ${formula.name} ${extString ? `com ${extString}` : ''}`,
    notes,
    intervals
  };
};

// Generate Harmonic Field
export const generateHarmonicField = (root: NoteName, type: 'major' | 'minor') => {
  const scale = generateScale(root, type === 'major' ? 'Maior Natural' : 'Menor Natural');
  const pattern = HARMONIC_FIELD_PATTERNS[type];

  return pattern.map((slot, index) => {
    const chordRoot = scale.notes[index];
    // Generate the full chord object for this slot
    const chord = generateChord(chordRoot, slot.type);
    return {
      degree: slot.degree,
      chord: chord
    };
  });
};
