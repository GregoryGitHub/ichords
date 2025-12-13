import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NoteName } from '../types';
import { ScalePosition, getNoteAtFret } from '../core/scalePositions';
import { CHROMATIC_SCALE } from '../constants';

interface ScaleTablatureProps {
  root: NoteName;
  scaleNotes: NoteName[];
  positions: ScalePosition[];
}

export const ScaleTablature: React.FC<ScaleTablatureProps> = ({ root, scaleNotes, positions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'diagram' | 'tab'>('diagram');

  // Resetar posição quando a escala ou tônica mudar
  useEffect(() => {
    setCurrentIndex(0);
  }, [root, scaleNotes]);

  // Restaurar preferência do usuário
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('ichords.scaleViewMode');
      if (stored === 'diagram' || stored === 'tab') setViewMode(stored);
    } catch {
      // noop
    }
  }, []);

  const updateViewMode = (mode: 'diagram' | 'tab') => {
    setViewMode(mode);
    try {
      window.localStorage.setItem('ichords.scaleViewMode', mode);
    } catch {
      // noop
    }
  };

  if (!positions || positions.length === 0) return null;

  const currentPosition = positions[currentIndex];
  const rootIndex = CHROMATIC_SCALE.indexOf(root);

  // Constantes de desenho
  const NUM_STRINGS = 6;
  const NUM_FRETS = 5;
  const STRING_SPACING = 30;
  const FRET_SPACING = 40;
  const MARGIN_X = 50;
  const MARGIN_Y = 40;
  const SVG_WIDTH = 280;
  const SVG_HEIGHT = 260;

  // Nomes das cordas (de cima para baixo no diagrama = da grave para aguda)
  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];

  // Verificar se uma nota é a tônica
  const isRootNote = (note: NoteName): boolean => {
    return CHROMATIC_SCALE.indexOf(note) === rootIndex;
  };

  // Normalizar casas para o desenho relativo ao startFret
  const normalizeFretsForDisplay = (frets: number[], startFret: number): number[] => {
    if (startFret === 1) return frets; // Cordas soltas aparecem na posição 0
    return frets.map(f => f === 0 ? 0 : f - startFret + 1);
  };

  const renderTextTab = () => {
    // Janela absoluta exibida: startAbs..startAbs+4
    const startAbs = currentPosition.startFret === 1 ? 0 : currentPosition.startFret;
    const endAbs = startAbs + 4;
    const cellWidth = 4; // mantém alinhamento mesmo com 2 dígitos

    const padCell = (content: string) => content.padEnd(cellWidth, ' ');
    const header = [
      padCell(''),
      ...Array.from({ length: 5 }).map((_, i) => padCell(String(startAbs + i))),
    ].join('');

    const lines = stringNames.map((sName, stringIndex) => {
      const fretsOnString = new Set(currentPosition.frets[stringIndex] || []);
      const cells = Array.from({ length: 5 }).map((_, i) => {
        const absFret = startAbs + i;
        if (!fretsOnString.has(absFret)) return padCell('----');

        // CifraClub-like: mostrar o número da casa.
        // (Nota: em janela 0-4, 0 pode aparecer; em janela alta, 10/11 etc cabem.)
        const label = String(absFret);
        const content = label.length >= cellWidth ? label.slice(0, cellWidth) : label + '-'.repeat(cellWidth - label.length);
        return content;
      });

      return `${sName}|${cells.join('')}`;
    });

    return [header, ...lines].join('\n');
  };

  const nextPosition = () => setCurrentIndex(prev => (prev + 1) % positions.length);
  const prevPosition = () => setCurrentIndex(prev => (prev - 1 + positions.length) % positions.length);

  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold text-white mb-4">Digitações da Escala</h2>

      {/* Seletor de visualização */}
      <div className="mb-3 flex items-center justify-end">
        <div className="inline-flex rounded-lg bg-slate-800/60 border border-slate-700 overflow-hidden">
          <button
            type="button"
            onClick={() => updateViewMode('diagram')}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              viewMode === 'diagram' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Diagrama
          </button>
          <button
            type="button"
            onClick={() => updateViewMode('tab')}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${
              viewMode === 'tab' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Tablatura
          </button>
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4 bg-slate-800/50 p-3 rounded-lg">
        <button 
          onClick={prevPosition}
          className="p-2 rounded-full bg-slate-800 text-brand-500 hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-slate-200 text-sm font-semibold text-center">
            {currentPosition.name}
          </span>
          <span className="text-slate-500 text-xs uppercase mt-1">
            {currentIndex + 1} / {positions.length}
          </span>
        </div>

        <button 
          onClick={nextPosition}
          className="p-2 rounded-full bg-slate-800 text-brand-500 hover:bg-slate-700 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {viewMode === 'diagram' ? (
        /* Diagrama SVG */
        <div className="relative bg-white rounded-lg p-4 shadow-lg">
          <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
            {/* Defs para sombras */}
            <defs>
              <filter id="shadow-scale" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25"/>
              </filter>
            </defs>

            {/* Casa Inicial Indicador (ex: 5ª casa) */}
            {currentPosition.startFret > 1 && (
              <text
                x={MARGIN_X}
                y={MARGIN_Y - 26}
                textAnchor="start"
                className="fill-slate-500 text-xs font-bold font-sans"
              >
                {currentPosition.startFret}ª casa
              </text>
            )}

            {/* NUT (Pestana superior) - apenas se startFret === 1 */}
            {currentPosition.startFret === 1 && (
              <rect 
                x={MARGIN_X} 
                y={MARGIN_Y - 2} 
                width={FRET_SPACING * NUM_FRETS} 
                height={4} 
                fill="#334155" 
              />
            )}

            {/* Frets (Linhas Verticais) */}
            {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
              <line
                key={`fret-${i}`}
                x1={MARGIN_X + i * FRET_SPACING}
                y1={MARGIN_Y}
                x2={MARGIN_X + i * FRET_SPACING}
                y2={MARGIN_Y + (NUM_STRINGS - 1) * STRING_SPACING}
                stroke="#94a3b8"
                strokeWidth={i === 0 ? 3 : 1.5}
              />
            ))}

            {/* Strings (Linhas Horizontais) */}
            {Array.from({ length: NUM_STRINGS }).map((_, i) => (
              <line
                key={`string-${i}`}
                x1={MARGIN_X}
                y1={MARGIN_Y + i * STRING_SPACING}
                x2={MARGIN_X + NUM_FRETS * FRET_SPACING}
                y2={MARGIN_Y + i * STRING_SPACING}
                stroke="#475569"
                strokeWidth={1.5 + (NUM_STRINGS - i) * 0.15} // Cordas graves mais grossas
              />
            ))}

            {/* Nomes das cordas */}
            {stringNames.map((name, i) => (
              <text
                key={`string-name-${i}`}
                x={MARGIN_X - 30}
                y={MARGIN_Y + i * STRING_SPACING + 5}
                className="fill-slate-500 text-sm font-bold font-sans"
                textAnchor="middle"
              >
                {name}
              </text>
            ))}

            {/* Notas da escala */}
            {currentPosition.frets.map((stringFrets, stringIndex) => {
              const normalizedFrets = normalizeFretsForDisplay(stringFrets, currentPosition.startFret);
              
              return normalizedFrets.map((fret, fretIndex) => {
                if (fret < 0 || fret > NUM_FRETS) return null;

                // fret 0 (corda solta): desenhar logo ANTES do nut, mas ainda dentro do SVG,
                // para não sobrepor a casa 1 e não ficar “pra fora” demais.
                const x = fret === 0
                  ? MARGIN_X - 14
                  : MARGIN_X + (fret - 0.5) * FRET_SPACING;
                const y = MARGIN_Y + stringIndex * STRING_SPACING;

                // Obter a nota real nessa posição
                const actualFret = stringFrets[fretIndex];
                const note = getNoteAtFret(stringIndex, actualFret);
                const isRoot = isRootNote(note);

                // Corda solta
                if (fret === 0) {
                  return (
                    <g key={`note-${stringIndex}-${fretIndex}`}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={7} 
                        className={isRoot ? "fill-brand-500" : "fill-slate-400"}
                        filter="url(#shadow-scale)"
                      />
                      <text 
                        x={x} 
                        y={y + 4} 
                        textAnchor="middle" 
                        className="fill-white text-[10px] font-bold font-sans"
                      >
                        {note}
                      </text>
                    </g>
                  );
                }

                // Nota no braço
                return (
                  <g key={`note-${stringIndex}-${fretIndex}`}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={9} 
                      className={isRoot ? "fill-brand-500" : "fill-slate-400"}
                      filter="url(#shadow-scale)"
                    />
                    <text 
                      x={x} 
                      y={y + 4} 
                      textAnchor="middle" 
                      className="fill-white text-[10px] font-bold font-sans"
                    >
                      {note}
                    </text>
                  </g>
                );
              });
            })}

            {/* Números das casas no topo */}
            {Array.from({ length: NUM_FRETS }).map((_, i) => {
              const fretNumber = currentPosition.startFret === 1 ? i + 1 : currentPosition.startFret + i;
              return (
                <text
                  key={`fret-number-${i}`}
                  x={MARGIN_X + (i + 0.5) * FRET_SPACING}
                  y={MARGIN_Y - 15}
                  className="fill-slate-400 text-[10px] font-bold font-sans"
                  textAnchor="middle"
                >
                  {fretNumber}
                </text>
              );
            })}
          </svg>
        </div>
      ) : (
        /* Tablatura em texto (pre formatado) */
        <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4 overflow-x-auto">
          <pre className="font-mono text-[12px] leading-6 text-slate-200 whitespace-pre">
            {renderTextTab()}
          </pre>
        </div>
      )}

      {/* Legenda */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-brand-500"></div>
          <span className="text-slate-400">Tônica ({root})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-400"></div>
          <span className="text-slate-400">Outras notas</span>
        </div>
      </div>

      <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
        <p>
          <strong className="text-brand-400">Dica:</strong> Cada posição mostra um "desenho" diferente da escala no braço. 
          Pratique movendo-se entre as posições para cobrir todo o braço da guitarra.
        </p>
      </div>
    </section>
  );
};

