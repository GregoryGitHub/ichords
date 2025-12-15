import { CHROMATIC_SCALE, INTERVALS_MAP, SCALE_PATTERNS, CHORD_FORMULAS, HARMONIC_FIELD_PATTERNS, MODAL_INTERCHANGE_PATTERNS } from '../constants';
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

  // Build Symbol with proper jazz nomenclature
  const has7 = formula.intervals.includes(10) || formula.intervals.includes(11);
  const has9 = extensions.includes(14);
  const has11 = extensions.includes(17);
  const has13 = extensions.includes(21);

  let symbol = root;
  let detailedExtensions = "";

  // Nomenclatura específica por tipo de acorde (forma explícita)
  if (baseType === 'dom7') {
    // Dominantes: C7(9), C7(13), C7(11), etc.
    symbol += "7";
    if (has9 || has11 || has13) {
      let extParts = [];
      if (has9) extParts.push("9");
      if (has11) extParts.push("11");
      if (has13) extParts.push("13");
      symbol += `(${extParts.join(",")})`;
      detailedExtensions = extParts.join(", ");
    }
  } else if (baseType === 'maj7') {
    // Maior com sétima maior: Cmaj7(9)
    symbol += "maj7";
    if (has9 || has11 || has13) {
      let extParts = [];
      if (has9) extParts.push("9");
      if (has11) extParts.push("11");
      if (has13) extParts.push("13");
      symbol += `(${extParts.join(",")})`;
      detailedExtensions = extParts.join(", ");
    }
  } else if (baseType === 'm7') {
    // Menor com sétima: Cm7(9)
    symbol += "m7";
    if (has9 || has11 || has13) {
      let extParts = [];
      if (has9) extParts.push("9");
      if (has11) extParts.push("11");
      if (has13) extParts.push("13");
      symbol += `(${extParts.join(",")})`;
      detailedExtensions = extParts.join(", ");
    }
  } else if (baseType === 'major') {
    // Tríade maior: C(add9)
    symbol += formula.symbol; // C
    if (has9 || has11 || has13) {
      let extParts = [];
      if (has9) extParts.push("add9");
      if (has11) extParts.push("add11");
      if (has13) extParts.push("add13");
      symbol += extParts.length > 1 ? `(${extParts.join(",")})` : extParts[0];
      detailedExtensions = has9 ? "9" : (has11 ? "11" : "13");
    }
  } else if (baseType === 'minor') {
    // Tríade menor: Cm(add9)
    symbol += formula.symbol; // Cm
    if (has9 || has11 || has13) {
      let extParts = [];
      if (has9) extParts.push("add9");
      if (has11) extParts.push("add11");
      if (has13) extParts.push("add13");
      symbol += extParts.length > 1 ? `(${extParts.join(",")})` : extParts[0];
      detailedExtensions = has9 ? "9" : (has11 ? "11" : "13");
    }
  } else {
    // Outros tipos (dim, aug, etc.)
    symbol += formula.symbol;
    if (has9 || has11 || has13) {
      let extParts = [];
      if (has9) extParts.push("9");
      if (has11) extParts.push("11");
      if (has13) extParts.push("13");
      symbol += `(${extParts.join(",")})`;
      detailedExtensions = extParts.join(", ");
    }
  }

  const detailedName = detailedExtensions
    ? `${root} ${formula.name} com ${detailedExtensions}`
    : `${root} ${formula.name}`;

  return {
    root,
    symbol,
    detailedName,
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

// Generate Modal Interchange Chords
export const generateModalInterchange = (root: NoteName, type: 'major' | 'minor') => {
  const patterns = MODAL_INTERCHANGE_PATTERNS[type];

  return patterns.map(pattern => {
    // Determine the root of the borrowed chord based on the interval offset
    const chordRoot = getNoteAtOffset(root, pattern.interval);

    // Generate the full chord object
    // We treat 'V7/IV' special or just rely on the fact it's a dom7 built on 'root' (if interval is 0, it means it's built on tonic)
    const chord = generateChord(chordRoot, pattern.type);

    return {
      degree: pattern.degree,
      chord: chord,
      origin: pattern.origin
    };
  });
};
