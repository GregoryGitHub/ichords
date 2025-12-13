import React, { useState, useMemo } from 'react';
import { NoteSelector } from '../components/NoteSelector';
import { generateHarmonicField } from '../core/musicTheory';
import { HarmonicFieldChordModal } from '../components/HarmonicFieldChordModal';
import { NoteName, Chord } from '../types';
import { ChevronRight } from 'lucide-react';
import { INTERVALS_MAP } from '../constants';

export const HarmonicFieldPage: React.FC = () => {
  const [root, setRoot] = useState<NoteName>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState<{ chord: Chord; degree: string } | null>(null);

  const harmonicField = useMemo(() => generateHarmonicField(root, mode), [root, mode]);

  // Descriptions for why chords are the way they are
  const getDidacticText = (degree: string) => {
    if (mode === 'major') {
      if (degree === 'I' || degree === 'IV') return 'Graus maiores e estáveis.';
      if (degree === 'V') return 'O Dominante. Cria tensão para voltar ao I.';
      if (degree === 'ii' || degree === 'iii' || degree === 'vi') return 'Graus menores relativos.';
      if (degree === 'vii°') return 'Meio-diminuto. Tensão máxima.';
    }
    return '';
  };

  return (
    <div className="pb-24 animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Campo Harmônico</h1>
        <p className="text-slate-400 text-sm">A família de acordes de uma tonalidade.</p>
      </header>

      <section className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6">
        <NoteSelector selectedNote={root} onSelect={setRoot} label="Tom" />
        
        <div className="flex bg-slate-800 p-1 rounded-lg mt-4">
          <button 
            onClick={() => setMode('major')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'major' ? 'bg-brand-600 text-white shadow' : 'text-slate-400'}`}
          >
            Maior
          </button>
          <button 
            onClick={() => setMode('minor')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'minor' ? 'bg-brand-600 text-white shadow' : 'text-slate-400'}`}
          >
            Menor Natural
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {harmonicField.map((slot, idx) => (
          <div 
            key={idx} 
            onClick={() => {
              setSelectedChord({ chord: slot.chord, degree: slot.degree });
              setIsModalOpen(true);
            }}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex items-center justify-between hover:bg-slate-750 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-serif italic text-slate-500 border border-slate-700">
                {slot.degree}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{slot.chord.symbol}</h3>
                <p className="text-xs text-slate-400">
                  {slot.chord.intervals.map(i => i.shortName).join(' - ')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                 {getDidacticText(slot.degree)}
               </span>
               <ChevronRight className="text-slate-600" size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
        <h3 className="text-white font-bold mb-2">Por que esses acordes?</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          O Campo Harmônico é formado apenas empilhando terças usando <strong>somente as notas da escala</strong> que você escolheu ({root} {mode === 'major' ? 'Maior' : 'Menor'}). 
          <br/><br/>
          Por exemplo, no tom de Dó Maior, o acorde de Ré é menor (Dm) porque a terça maior de Ré (F#) não existe na escala de Dó. Temos que usar o Fá natural, resultando numa terça menor.
        </p>
      </div>

      {selectedChord && (
        <HarmonicFieldChordModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedChord(null);
          }}
          chord={selectedChord.chord}
          degree={selectedChord.degree}
        />
      )}
    </div>
  );
};
