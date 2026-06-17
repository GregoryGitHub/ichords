import React, { useEffect, useMemo, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
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
  const [handMode, setHandMode] = useState<'both' | 'left' | 'right'>('both');
  const [showType, setShowType] = useState<'intervals' | 'fingers'>('intervals');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isZoomed) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsZoomed(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isZoomed]);

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

  const assignSingleHandKeys = (
    target: Map<number, ActiveKey>,
    rootOffset: number,
    hand: 'left' | 'right',
    transposeOctave: number,
  ) => {
    const keysList: Omit<ActiveKey, 'finger'>[] = intervals.map((interval, idx) => {
      let keyIndex = rootOffset + transposeOctave + interval.semitones;
      while (keyIndex > 36) {
        if (transposeOctave > 0 && keyIndex - 12 < rootOffset + transposeOctave) {
          break;
        }
        keyIndex -= 12;
      }
      return {
        keyIndex,
        noteName: notes[idx] || '',
        interval,
        hand,
      };
    });

    const sortedKeys = [...keysList].sort((a, b) => a.keyIndex - b.keyIndex);
    const N = sortedKeys.length;
    let fingers: number[] = [];
    if (N === 1) fingers = [1];
    else if (N === 2) fingers = [1, 5];
    else if (N === 3) fingers = [1, 3, 5];
    else if (N === 4) fingers = [1, 2, 4, 5];
    else fingers = Array.from({ length: N }, (_, i) => (i < 5 ? i + 1 : 5));

    sortedKeys.forEach((key, idx) => {
      target.set(key.keyIndex, {
        ...key,
        finger: fingers[idx],
      });
    });
  };

  const assignLeftHandBassKeys = (target: Map<number, ActiveKey>, rootOffset: number) => {
    const lhKeysList: Omit<ActiveKey, 'finger'>[] = [];

    lhKeysList.push({
      keyIndex: rootOffset,
      noteName: root,
      interval: intervals.find(i => i.quality === 'root') || { semitones: 0, name: 'Tônica', shortName: 'T', quality: 'root' },
      hand: 'left' as const,
    });

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

    const sortedLhKeys = [...lhKeysList].sort((a, b) => a.keyIndex - b.keyIndex);
    sortedLhKeys.forEach((key, idx) => {
      let finger = 5;
      if (sortedLhKeys.length > 1 && idx === 1) {
        finger = 1;
      }
      target.set(key.keyIndex, {
        ...key,
        finger,
      });
    });
  };

  const getActiveKeyColor = (activeInfo: ActiveKey, labelMode: 'intervals' | 'fingers') => {
    if (handMode === 'both' || handMode === 'left') {
      return getHandColor(activeInfo.hand);
    }
    if (labelMode === 'fingers') {
      return getHandColor('right');
    }
    return getIntervalColor(activeInfo.interval.quality);
  };

  // Determine active keys based on selected mode
  const activeKeys = useMemo(() => {
    const rootOffset = CHROMATIC_SCALE.indexOf(root);
    const result = new Map<number, ActiveKey>();

    if (rootOffset === -1) return result;

    if (handMode === 'right') {
      assignSingleHandKeys(result, rootOffset, 'right', 0);
    } else if (handMode === 'left') {
      assignSingleHandKeys(result, rootOffset, 'left', 0);
    } else {
      assignLeftHandBassKeys(result, rootOffset);
      assignSingleHandKeys(result, rootOffset, 'right', 12);
    }

    return result;
  }, [root, notes, intervals, handMode]);

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

  const activeFingersByHand = useMemo(() => {
    const left = new Map<number, ActiveKey>();
    const right = new Map<number, ActiveKey>();

    activeKeys.forEach((key) => {
      if (!key.finger) return;
      if (key.hand === 'left') left.set(key.finger, key);
      else right.set(key.finger, key);
    });

    return { left, right };
  }, [activeKeys]);

  const formatHandFingering = (hand: 'left' | 'right') => {
    const fingerMap = hand === 'left' ? activeFingersByHand.left : activeFingersByHand.right;
    if (fingerMap.size === 0) return null;

    return Array.from(fingerMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([finger, key]) => `dedo ${finger} (${key.noteName})`)
      .join(' · ');
  };

  const renderHandsImage = (isZoomedView = false) => {
    const fullMaxWidth = isZoomedView ? 420 : 300;
    const singleMaxWidth = isZoomedView ? 240 : 170;

    if (handMode === 'both') {
      return (
        <img
          src="/images/keyboard-hands.png"
          alt="Referência de dedilhado com numeração dos dedos das mãos esquerda e direita"
          className="w-full mx-auto h-auto block"
          style={{ maxWidth: fullMaxWidth }}
        />
      );
    }

    const alt =
      handMode === 'left'
        ? 'Referência de dedilhado da mão esquerda com numeração dos dedos'
        : 'Referência de dedilhado da mão direita com numeração dos dedos';

    return (
      <div
        className="mx-auto overflow-hidden w-full"
        style={{ maxWidth: singleMaxWidth }}
      >
        <img
          src="/images/keyboard-hands.png"
          alt={alt}
          className="block h-auto max-w-none w-[200%]"
          style={{ transform: handMode === 'right' ? 'translateX(-50%)' : undefined }}
        />
      </div>
    );
  };

  const renderHandsSection = (isZoomedView = false) => {
    const leftFingering = formatHandFingering('left');
    const rightFingering = formatHandFingering('right');
    const showLeftFingering = (handMode === 'both' || handMode === 'left') && leftFingering;
    const showRightFingering = (handMode === 'both' || handMode === 'right') && rightFingering;

    return (
      <div
        className={
          isZoomedView
            ? 'w-full px-4 pb-5 pt-2 border-t border-slate-800/80'
            : 'mt-3 w-full bg-slate-900/50 p-3 rounded-lg border border-slate-800'
        }
      >
        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-3">
          <span className="text-[10px] font-semibold text-slate-300">Posição das Mãos</span>
          <span className="text-[9px] text-slate-500">1=Polegar | 5=Mínimo</span>
        </div>

        {renderHandsImage(isZoomedView)}

        <div className="mt-3 space-y-1 text-[9px] text-slate-400 text-center leading-relaxed">
          {showLeftFingering && (
            <p>
              <span className="font-semibold" style={{ color: getHandColor('left') }}>Esquerda:</span>{' '}
              {leftFingering}
            </p>
          )}
          {showRightFingering && (
            <p>
              <span className="font-semibold" style={{ color: getHandColor('right') }}>Direita:</span>{' '}
              {rightFingering}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderKeyboardSvg = (svgClassName: string, forceFingering = false) => {
    const labelMode = forceFingering ? 'fingers' : showType;

    return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className={svgClassName}
    >
      {whiteKeys.map(key => {
        const x = key.whiteIndex * W_W;
        const activeColor = key.isActive && key.activeInfo
          ? getActiveKeyColor(key.activeInfo, labelMode)
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
                  {labelMode === 'intervals'
                    ? key.activeInfo.interval.shortName
                    : key.activeInfo.finger}
                </text>
              </g>
            )}
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

      {blackKeys.map(key => {
        const x = (key.whiteIndex + 1) * W_W - W_B / 2;
        const activeColor = key.isActive && key.activeInfo
          ? getActiveKeyColor(key.activeInfo, labelMode)
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
                  {labelMode === 'intervals'
                    ? key.activeInfo.interval.shortName
                    : key.activeInfo.finger}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
    );
  };

  const renderLegend = () => (
    <div className="mt-3 w-full bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
      {handMode === 'both' ? (
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
      ) : handMode === 'left' ? (
        <>
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5 mb-1.5">
            <span className="font-semibold text-slate-300">Mão Esquerda</span>
            <span className="text-[9px] text-slate-500">1=Polegar | 5=Mínimo</span>
          </div>
          <p className="text-center text-[9px]">
            <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: getHandColor('left') }} />
            Acorde completo na mão esquerda
          </p>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5 mb-1.5">
            <span className="font-semibold text-slate-300">Graus do Acorde (Mão Direita)</span>
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
  );

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Toggles */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 w-full justify-center text-xs">
        {/* Hand Mode Selector */}
        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          <button
            onClick={() => setHandMode('both')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-all ${
              handMode === 'both' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Duas mãos
          </button>
          <button
            onClick={() => setHandMode('right')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-all ${
              handMode === 'right' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mão direita
          </button>
          <button
            onClick={() => setHandMode('left')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md font-semibold transition-all ${
              handMode === 'left' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mão esquerda
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
      <button
        type="button"
        onClick={() => setIsZoomed(true)}
        className="group relative w-full max-w-full bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner flex justify-center cursor-pointer transition-all hover:border-brand-500/50 hover:shadow-[0_0_20px_rgba(113,55,200,0.15)] active:scale-[0.99]"
        aria-label="Ampliar teclado"
      >
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn size={12} />
          Ampliar
        </span>
        {renderKeyboardSvg('w-full max-w-[320px] h-auto overflow-visible')}
      </button>

      {renderHandsSection()}

      {renderLegend()}

      {isZoomed && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-center bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Teclado ampliado"
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-slate-800/90 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Fechar ampliação"
          >
            <X size={22} />
          </button>

          <div
            className="w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-full bg-slate-950 border-y border-slate-800 shadow-2xl">
              <div className="py-4 px-1">
                {renderKeyboardSvg('w-full h-auto overflow-visible', true)}
              </div>
              {renderHandsSection(true)}
            </div>
          </div>

          <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-500">
            Toque fora ou pressione Esc para fechar
          </p>
        </div>
      )}
    </div>
  );
};
