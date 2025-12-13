import React, { useRef, useEffect } from 'react';
import { CHROMATIC_SCALE } from '../constants';
import { NoteName } from '../types';

interface NoteSelectorProps {
  selectedNote: NoteName;
  onSelect: (note: NoteName) => void;
  label?: string;
}

export const NoteSelector: React.FC<NoteSelectorProps> = ({ selectedNote, onSelect, label }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to selected note on mount
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = document.getElementById(`note-btn-${selectedNote}`);
      if (selectedEl) {
        scrollRef.current.scrollTo({
          left: selectedEl.offsetLeft - scrollRef.current.offsetWidth / 2 + selectedEl.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedNote]);

  return (
    <div className="flex flex-col gap-2 mb-4">
      {label && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>}
      <div 
        ref={scrollRef}
        // Ajustes: 
        // -mx-4: Estende o scroll até as bordas do container pai
        // px-4: Adiciona respiro interno nas pontas
        // py-5: Aumentado para evitar que a sombra/scale do item selecionado seja cortada
        className="flex overflow-x-auto gap-3 py-5 px-4 -mx-4 no-scrollbar items-center snap-x touch-pan-x"
      >
        {CHROMATIC_SCALE.map((note) => (
          <button
            key={note}
            id={`note-btn-${note}`}
            onClick={() => onSelect(note)}
            className={`
              snap-center
              flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
              ${selectedNote === note 
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 scale-110' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
            `}
          >
            {note}
          </button>
        ))}
        {/* Spacer final para garantir conforto visual no último item */}
        <div className="w-1 flex-shrink-0"></div>
      </div>
    </div>
  );
};