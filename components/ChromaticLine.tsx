import React from 'react';
import { CHROMATIC_SCALE } from '../constants';
import { Interval, NoteName } from '../types';

interface ChromaticLineProps {
  root: NoteName;
  activeIntervals: Interval[]; // Intervals present in the current scale/chord
}

export const ChromaticLine: React.FC<ChromaticLineProps> = ({ root, activeIntervals }) => {
  
  // Reorder chromatic scale starting from Root for display purposes
  const rootIndex = CHROMATIC_SCALE.indexOf(root);
  const reorderedNotes = [
    ...CHROMATIC_SCALE.slice(rootIndex),
    ...CHROMATIC_SCALE.slice(0, rootIndex)
  ];

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

  return (
    <div className="w-full bg-slate-800/50 rounded-xl p-4 my-6 border border-slate-700 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-20"></div>
      
      <div className="flex justify-between items-end relative h-24">
        {reorderedNotes.map((note, index) => {
          // Find if this note (by index relative to root) is active
          // semitones = index because we reordered the array starting at root
          const activeInterval = activeIntervals.find(i => i.semitones === index || i.semitones === index + 12); // +12 for extensions visual mapping
          
          return (
            <div key={`${note}-${index}`} className="flex flex-col items-center flex-1 relative group">
              
              {/* Connection Line segment (except last) */}
              {index < 11 && (
                <div className="absolute top-[60%] left-1/2 w-full h-0.5 bg-slate-700 -z-10"></div>
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
                absolute bottom-0 transform translate-y-full pt-2 transition-all duration-300
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
