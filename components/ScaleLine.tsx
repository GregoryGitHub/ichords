import React from 'react';
import { Chord, NoteName } from '../types';
import { generateScale } from '../core/musicTheory';

interface ScaleLineProps {
  root: NoteName;
  mode: 'major' | 'minor';
  chord: Chord;
}

export const ScaleLine: React.FC<ScaleLineProps> = ({ root, mode, chord }) => {
  // Gerar a escala da tônica selecionada
  const scale = generateScale(root, mode === 'major' ? 'Maior Natural' : 'Menor Natural');

  // Helper to determine color based on interval quality
  const getIntervalColor = (quality?: string) => {
    switch(quality) {
      case 'root': return 'bg-note-root';
      case 'third': return 'bg-note-third';
      case 'fifth': return 'bg-note-fifth';
      case 'seventh': return 'bg-note-seventh';
      case 'extension': return 'bg-note-ext';
      default: return 'bg-slate-600';
    }
  };

  // Reordenar a escala para começar pela tônica do acorde selecionado (ex.: Dm7 começa em D)
  // Isso garante que, por exemplo, o C (b7) apareça depois do B.
  const scaleSet = new Set<NoteName>(scale.notes);
  const startIndex = scale.notes.indexOf(chord.root);
  const orderedScaleNotes =
    startIndex >= 0
      ? [...scale.notes.slice(startIndex), ...scale.notes.slice(0, startIndex)]
      : scale.notes;

  const chordIntervalByNote = new Map<NoteName, (typeof chord.intervals)[number]>();
  chord.notes.forEach((note, idx) => {
    const interval = chord.intervals[idx];
    if (interval) chordIntervalByNote.set(note, interval);
  });

  return (
    <div className="w-full bg-slate-800/50 rounded-xl p-4 pb-6 mb-6 border border-slate-700 overflow-visible relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-20"></div>
      
      <div className="flex justify-between items-center relative min-h-24">
        {orderedScaleNotes.map((note, index) => {
          // Defesa: se por algum motivo a nota não pertence à escala calculada, não renderiza.
          // (Ajuda em casos de escalas/alterações futuras.)
          if (!scaleSet.has(note)) return null;

          const activeInterval = chordIntervalByNote.get(note);
          
          return (
            <div key={`${note}-${index}`} className="flex flex-col items-center justify-center flex-1 relative group">
              
              {/* Connection Line segment (except last) */}
              {index < orderedScaleNotes.length - 1 && (
                <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-slate-700 -z-10 -translate-y-1/2"></div>
              )}

              {/* Note Name */}
              <span className={`text-xs font-medium mb-2 ${activeInterval ? 'text-white' : 'text-slate-600'}`}>
                {note}
              </span>

              {/* Dot / Indicator */}
              <div className={`
                w-3 h-3 rounded-full transition-all duration-300 z-10
                ${activeInterval ? getIntervalColor(activeInterval.quality) : 'bg-slate-700'}
                ${activeInterval ? 'scale-125 shadow-md' : 'scale-100'}
              `}></div>

              {/* Interval Label (Popup/Bubble) */}
              <div className={`
                absolute top-full transform pt-2 transition-all duration-300
                ${activeInterval ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
              `}>
                <span className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded
                  ${activeInterval ? getIntervalColor(activeInterval.quality) + ' text-white' : ''}
                `}>
                  {activeInterval?.shortName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

