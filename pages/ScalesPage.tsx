import React, { useState, useMemo } from 'react';
import { NoteSelector } from '../components/NoteSelector';
import { ChromaticLine } from '../components/ChromaticLine';
import { InfoCard } from '../components/InfoCard';
import { ScaleTablature } from '../components/ScaleTablature';
import { generateScale } from '../core/musicTheory';
import { generateScalePositions } from '../core/scalePositions';
import { SCALE_PATTERNS } from '../constants';
import { NoteName } from '../types';

export const ScalesPage: React.FC = () => {
  const [root, setRoot] = useState<NoteName>('C');
  const [scaleType, setScaleType] = useState<string>(SCALE_PATTERNS[0].name);

  const scaleData = useMemo(() => generateScale(root, scaleType), [root, scaleType]);
  const currentPattern = SCALE_PATTERNS.find(p => p.name === scaleType);
  
  // Gerar as 5 posições CAGED da escala
  const scalePositions = useMemo(() => 
    generateScalePositions(root, scaleData.notes), 
    [root, scaleData.notes]
  );

  return (
    <div className="pb-6 animate-in fade-in duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Escalas</h1>
        <p className="text-slate-400 text-sm">Entenda como as escalas são formadas.</p>
      </header>

      {/* Controls */}
      <section className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6">
        <NoteSelector selectedNote={root} onSelect={setRoot} label="Tônica" />
        
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Tipo de Escala</label>
          <select 
            value={scaleType}
            onChange={(e) => setScaleType(e.target.value)}
            className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-brand-500 outline-none appearance-none"
          >
            {SCALE_PATTERNS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Visualizer */}
      <section className="mb-6">
        <ChromaticLine root={root} activeIntervals={scaleData.intervals} />
      </section>

      {/* Information */}
      <section>
        <InfoCard 
          title={`${root} ${scaleType}`}
          description={currentPattern?.description || ''}
          items={[
            { label: 'Notas', value: scaleData.notes.join(' - ') },
            { label: 'Intervalos', value: scaleData.intervals.map(i => i.shortName).join(' - ') }
          ]}
        />
        
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400">
          <p>
            <strong className="text-brand-400">Dica:</strong> Observe os espaços entre os pontos coloridos. 
            Eles representam os tons (2 casas) e semitons (1 casa) que definem a "fórmula" da escala.
          </p>
        </div>
      </section>

      {/* Digitações da Escala */}
      <ScaleTablature 
        root={root}
        scaleNotes={scaleData.notes}
        positions={scalePositions}
      />
    </div>
  );
};
