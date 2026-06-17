import React, { useMemo, useState } from 'react';
import { NoteName, Interval } from '../types';
import { CHROMATIC_SCALE } from '../constants';

interface KeyboardChordVisualizerProps {
  root: NoteName;
  notes: NoteName[];
  intervals: Interval[];
}

interface ActiveKey {
  keyIndex: number;
  noteName: string;
  interval: Interval;
  hand: 'left' | 'right';
  finger?: number;
}

export const KeyboardChordVisualizer: React.FC<KeyboardChordVisualizerProps> = ({
  root,
  notes,
  intervals,
}) => {
  const [mode, setMode] = useState<'one-hand' | 'two-hands'>('two-hands');
  const [showType, setShowType] = useState<'intervals' | 'fingers'>('intervals');

  // SVG Keyboard constants
  const W_W = 14; // White key width
  const H_W = 60; // White key height
  const W_B = 8;  // Black key width
  const H_B = 38; // Black key height
  const SVG_WIDTH = 22 * W_W; // 22 white keys (3 octaves + 1 extra C)
  const SVG_HEIGHT = 80;

  // Interval Quality Color Map
  const getIntervalColor = (quality?: string) => {
    switch (quality) {
      case 'root': return '#ef4444';      // Red
      case 'third': return '#22c55e';     // Green
      case 'fifth': return '#3b82f6';     // Blue
      case 'seventh': return '#a855f7';   // Purple
      case 'extension': return '#f59e0b'; // Amber
      default: return '#64748b';          // Slate
    }
  };

  // Hand Color Map
  const getHandColor = (hand: 'left' | 'right') => {
    return hand === 'left' ? '#6366f1' : '#0ea5e9'; // Indigo for Left, Sky Blue for Right
  };

  // Standard gray color for all pressed keys
  const ACTIVE_KEY_FILL = '#cbd5e1';

  // Determine active keys based on selected mode
  const activeKeys = useMemo(() => {
    const rootOffset = CHROMATIC_SCALE.indexOf(root);
    const result = new Map<number, ActiveKey>();

    if (rootOffset === -1) return result;

    if (mode === 'one-hand') {
      // 1. One Hand (Right Hand) Mode
      const keysList: Omit<ActiveKey, 'finger'>[] = intervals.map((interval, idx) => {
        let keyIndex = rootOffset + interval.semitones;
        // Wrap octave if note exceeds keyboard bounds (C6 = 36)
        while (keyIndex > 36) {
          keyIndex -= 12;
        }
        return {
          keyIndex,
          noteName: notes[idx] || '',
          interval,
          hand: 'right' as const,
        };
      });

      // Sort and assign fingers
      const sortedKeys = [...keysList].sort((a, b) => a.keyIndex - b.keyIndex);
      const N = sortedKeys.length;
      let fingers: number[] = [];
      if (N === 1) fingers = [1];
      else if (N === 2) fingers = [1, 5];
      else if (N === 3) fingers = [1, 3, 5];
      else if (N === 4) fingers = [1, 2, 4, 5];
      else fingers = Array.from({ length: N }, (_, i) => (i < 5 ? i + 1 : 5));

      sortedKeys.forEach((key, idx) => {
        result.set(key.keyIndex, {
          ...key,
          finger: fingers[idx],
        });
      });

    } else {
      // 2. Two Hands Mode
      // Left Hand plays Root (and Fifth if present) in the bass octave
      const lhKeysList: Omit<ActiveKey, 'finger'>[] = [];
      
      // LH Root (always present)
      lhKeysList.push({
        keyIndex: rootOffset,
        noteName: root,
        interval: intervals.find(i => i.quality === 'root') || { semitones: 0, name: 'Tônica', shortName: 'T', quality: 'root' },
        hand: 'left' as const,
      });

      // LH Fifth (if present in intervals)
      const fifthInterval = intervals.find(i => i.quality === 'fifth');
      if (fifthInterval) {
        const fifthIdx = intervals.indexOf(fifthInterval);
        lhKeysList.push({
          keyIndex: rootOffset + fifthInterval.semitones,
          noteName: notes[fifthIdx] || '',
          interval: fifthInterval,
          hand: 'left' as const,
        });
      }

      // Sort and assign LH fingers (5 for root, 1 or 2 for fifth)
      const sortedLhKeys = [...lhKeysList].sort((a, b) => a.keyIndex - b.keyIndex);
      sortedLhKeys.forEach((key, idx) => {
        let finger = 5; // Default for root
        if (sortedLhKeys.length > 1 && idx === 1) {
          finger = 1; // Thumb for the fifth
        }
        result.set(key.keyIndex, {
          ...key,
          finger,
        });
      });

      // Right Hand plays the chord notes transposed up by 1 octave (+12 semitones)
      const rhKeysList: Omit<ActiveKey, 'finger'>[] = intervals.map((interval, idx) => {
        let keyIndex = rootOffset + 12 + interval.semitones;
        // Wrap down only if it exceeds C6 (36) and does not overlap with Left Hand octave
        while (keyIndex > 36) {
          if (keyIndex - 12 < rootOffset + 12) {
            break; // Keep it in Right Hand range
          }
          keyIndex -= 12;
        }
        return {
          keyIndex,
          noteName: notes[idx] || '',
          interval,
          hand: 'right' as const,
        };
      });

      // Sort and assign RH fingers
      const sortedRhKeys = [...rhKeysList].sort((a, b) => a.keyIndex - b.keyIndex);
      const N = sortedRhKeys.length;
      let fingers: number[] = [];
      if (N === 1) fingers = [1];
      else if (N === 2) fingers = [1, 5];
      else if (N === 3) fingers = [1, 3, 5];
      else if (N === 4) fingers = [1, 2, 4, 5];
      else fingers = Array.from({ length: N }, (_, i) => (i < 5 ? i + 1 : 5));

      sortedRhKeys.forEach((key, idx) => {
        result.set(key.keyIndex, {
          ...key,
          finger: fingers[idx],
        });
      });
    }

    return result;
  }, [root, notes, intervals, mode]);

  // Generate 37 keyboard keys (C3 to C6)
  const keyboardKeys = useMemo(() => {
    return Array.from({ length: 37 }, (_, index) => {
      const noteInOctave = index % 12;
      const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
      const noteName = CHROMATIC_SCALE[noteInOctave];
      
      // Calculate white key index
      // C=0, D=1, E=2, F=3, G=4, A=5, B=6
      const whiteKeyOffsets = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
      const octave = Math.floor(index / 12);
      const whiteIndex = index === 36 ? 21 : octave * 7 + whiteKeyOffsets[noteInOctave];

      const activeInfo = activeKeys.get(index);

      return {
        index,
        isBlack,
        noteName,
        whiteIndex,
        isActive: !!activeInfo,
        activeInfo,
      };
    });
  }, [activeKeys]);

  // Separate white and black keys to draw white keys first (z-index ordering in SVG)
  const whiteKeys = keyboardKeys.filter(k => !k.isBlack);
  const blackKeys = keyboardKeys.filter(k => k.isBlack);

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Toggles */}
      <div className="flex gap-4 mb-4 w-full justify-center text-xs">
        {/* Mode Selector */}
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={() => setMode('two-hands')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              mode === 'two-hands' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Duas Mãos
          </button>
          <button
            onClick={() => setMode('one-hand')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              mode === 'one-hand' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Uma Mão
          </button>
        </div>

        {/* View Type Selector */}
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={() => setShowType('intervals')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              showType === 'intervals' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Graus
          </button>
          <button
            onClick={() => setShowType('fingers')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              showType === 'fingers' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dedilhado
          </button>
        </div>
      </div>

      {/* SVG Keyboard */}
      <div className="w-full max-w-full bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner flex justify-center">
        <svg 
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
          className="w-full max-w-[320px] h-auto overflow-visible"
        >
          {/* 1. Draw White Keys */}
          {whiteKeys.map(key => {
            const x = key.whiteIndex * W_W;
            const activeColor = key.isActive && key.activeInfo
              ? (mode === 'two-hands' ? getHandColor(key.activeInfo.hand) : getIntervalColor(key.activeInfo.interval.quality))
              : null;
            
            return (
              <g key={`white-${key.index}`}>
                <rect
                  x={x}
                  y={0}
                  width={W_W}
                  height={H_W}
                  rx={1.5}
                  className="transition-all duration-200"
                  fill={key.isActive ? ACTIVE_KEY_FILL : '#f8fafc'}
                  stroke="#cbd5e1"
                  strokeWidth={0.5}
                />
                {/* Visual indicator on pressed keys */}
                {key.isActive && key.activeInfo && (
                  <g>
                    <circle
                      cx={x + W_W / 2}
                      cy={H_W - 12}
                      r={5}
                      fill={activeColor || '#64748b'}
                      className="animate-in zoom-in duration-200"
                    />
                    <text
                      x={x + W_W / 2}
                      y={H_W - 9.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="6px"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {showType === 'intervals' 
                        ? key.activeInfo.interval.shortName 
                        : key.activeInfo.finger}
                    </text>
                  </g>
                )}
                {/* Note Label (C3, C4, C5, C6) */}
                {key.noteName === 'C' && (
                  <text
                    x={x + W_W / 2}
                    y={H_W + 12}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="6.5px"
                    fontWeight="medium"
                  >
                    C{3 + Math.floor(key.index / 12)}
                  </text>
                )}
              </g>
            );
          })}

          {/* 2. Draw Black Keys */}
          {blackKeys.map(key => {
            const x = (key.whiteIndex + 1) * W_W - W_B / 2;
            const activeColor = key.isActive && key.activeInfo
              ? (mode === 'two-hands' ? getHandColor(key.activeInfo.hand) : getIntervalColor(key.activeInfo.interval.quality))
              : null;

            return (
              <g key={`black-${key.index}`}>
                <rect
                  x={x}
                  y={0}
                  width={W_B}
                  height={H_B}
                  rx={1}
                  className="transition-all duration-200"
                  fill={key.isActive ? ACTIVE_KEY_FILL : '#0f172a'}
                  stroke="#334155"
                  strokeWidth={0.5}
                />
                {/* Visual indicator on pressed black keys */}
                {key.isActive && key.activeInfo && (
                  <g>
                    <circle
                      cx={x + W_B / 2}
                      cy={H_B - 9}
                      r={5}
                      fill={activeColor || '#64748b'}
                      className="animate-in zoom-in duration-200"
                    />
                    <text
                      x={x + W_B / 2}
                      y={H_B - 6.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="6px"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {showType === 'intervals' 
                        ? key.activeInfo.interval.shortName 
                        : key.activeInfo.finger}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 w-full bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
        {mode === 'two-hands' ? (
          <>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5 mb-1.5">
              <span className="font-semibold text-slate-300">Dedilhado de Duas Mãos</span>
              <span className="text-[9px] text-slate-500">1=Polegar | 5=Mínimo</span>
            </div>
            <div className="flex gap-4 justify-around">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getHandColor('left') }} />
                Mão Esquerda: Baixo (Tônica + Quinta)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getHandColor('right') }} />
                Mão Direita: Acorde & Extensões
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5 mb-1.5">
              <span className="font-semibold text-slate-300">Graus do Acorde (Uma Mão)</span>
              <span className="text-[9px] text-slate-500">1=Polegar | 5=Mínimo</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-1 gap-x-2 text-[9px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getIntervalColor('root') }} />
                Tônica (T)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getIntervalColor('third') }} />
                Terça (3)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getIntervalColor('fifth') }} />
                Quinta (5)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getIntervalColor('seventh') }} />
                Sétima (7)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getIntervalColor('extension') }} />
                Extensão (9/11/13)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
