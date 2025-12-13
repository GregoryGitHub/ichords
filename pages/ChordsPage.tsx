import React, { useState, useMemo } from 'react';
import { NoteSelector } from '../components/NoteSelector';
import { ChromaticLine } from '../components/ChromaticLine';
import { InfoCard } from '../components/InfoCard';
import { GuitarChordModal } from '../components/GuitarChordModal';
import { generateChord } from '../core/musicTheory';
import { CHORD_FORMULAS } from '../constants';
import { NoteName } from '../types';
import { Check, Info, Hand } from 'lucide-react';

export const ChordsPage: React.FC = () => {
  const [root, setRoot] = useState<NoteName>('C');
  const [chordType, setChordType] = useState<string>('major');
  const [extensions, setExtensions] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleExtension = (semitone: number) => {
    setExtensions(prev => 
      prev.includes(semitone) ? prev.filter(s => s !== semitone) : [...prev, semitone]
    );
  };

  const chordData = useMemo(() => generateChord(root, chordType, extensions), [root, chordType, extensions]);
  const currentFormula = CHORD_FORMULAS[chordType];

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Acordes</h1>
        <p className="text-slate-400 text-sm">Monte acordes e adicione extensões.</p>
      </header>

      {/* Main Display - Clickable */}
      <div className="flex flex-col items-center justify-center py-6 relative group">
        <div 
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center cursor-pointer transition-transform duration-200 active:scale-95"
        >
          <span className="text-slate-500 text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
            Resultado <Hand size={14} className="text-brand-500 animate-pulse" />
          </span>
          <h2 className="text-6xl font-bold text-brand-400 tracking-tight transition-all duration-300 group-hover:text-brand-300 group-hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            {chordData.symbol}
          </h2>
          <span className="text-slate-400 mt-2 text-sm border-b border-dashed border-slate-700 pb-0.5 group-hover:border-brand-500 transition-colors">
            {chordData.detailedName}
          </span>
          <span className="mt-2 text-[10px] text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-4">
            Ver no violão
          </span>
        </div>
      </div>

      <ChromaticLine root={root} activeIntervals={chordData.intervals} />

      {/* Controls */}
      <section className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-6">
        <NoteSelector selectedNote={root} onSelect={setRoot} label="Fundamental (Tônica)" />

        {/* Chord Type Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Base do Acorde</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CHORD_FORMULAS).map(([key, formula]) => (
              <button
                key={key}
                onClick={() => setChordType(key)}
                className={`
                  p-3 rounded-lg text-sm font-medium text-left border transition-all
                  ${chordType === key 
                    ? 'bg-brand-600 border-brand-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}
                `}
              >
                <div className="flex justify-between items-center">
                  <span>{formula.name}</span>
                  {chordType === key && <Check size={14} />}
                </div>
                <span className="text-xs opacity-60 block mt-1">{root}{formula.symbol}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Extensions */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Extensões (Tensões)</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: 14, label: '9ª' },
              { val: 17, label: '11ª' }, // 11 justa (avoid note on Major usually, but theoretical)
              { val: 21, label: '13ª' }
            ].map((ext) => {
              const isActive = extensions.includes(ext.val);
              return (
                <button
                  key={ext.val}
                  onClick={() => toggleExtension(ext.val)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-bold border transition-all
                    ${isActive 
                      ? 'bg-amber-500 border-amber-500 text-white' 
                      : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-500'}
                  `}
                >
                  +{ext.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Info size={12} />
            Extensões são empilhadas em terças após a 7ª.
          </p>
        </div>
      </section>

      <div className="mt-6">
        <InfoCard 
          title="Estrutura Intervalar"
          description={currentFormula.description}
          items={[
             { label: 'Fórmula', value: chordData.intervals.map(i => i.shortName).join(' - ') },
             { label: 'Notas', value: chordData.notes.join(' - ') }
          ]}
        />
      </div>

      <GuitarChordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        root={root}
        chordType={chordType}
        chordSymbol={chordData.symbol}
        extensions={extensions}
      />
    </div>
  );
};
