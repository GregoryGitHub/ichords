import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { 
  getAllShapeTypes, 
  updateShapes, 
  ChordShape,
  clearCache 
} from '../firebase/shapesService';
import { LogIn, LogOut, Save, Plus, Trash2, Edit2, X, MousePointer } from 'lucide-react';

// Componente de Editor Visual de Violão
const VisualFretboardEditor: React.FC<{
  frets: number[];
  fingers?: number[];
  onFretsChange: (newFrets: number[]) => void;
  baseString: 6 | 5 | 4;
}> = ({ frets, fingers, onFretsChange, baseString }) => {
  const NUM_STRINGS = 6;
  const NUM_FRETS = 12;
  const STRING_SPACING = 35;
  const FRET_SPACING = 50;
  const MARGIN_X = 60;
  const MARGIN_Y = 40;
  const SVG_WIDTH = 700;
  const SVG_HEIGHT = 280;

  const stringNames = ['E', 'A', 'D', 'G', 'B', 'e'];

  const handleFretClick = (stringIndex: number, fret: number) => {
    const newFrets = [...frets];
    
    // Se clicar no mesmo fret, marca como -1 (não tocar)
    if (newFrets[stringIndex] === fret) {
      newFrets[stringIndex] = -1;
    } else {
      newFrets[stringIndex] = fret;
    }
    
    onFretsChange(newFrets);
  };

  const isRootString = (stringIndex: number): boolean => {
    if (baseString === 6) return stringIndex === 0;
    if (baseString === 5) return stringIndex === 1;
    if (baseString === 4) return stringIndex === 2;
    return false;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
        <MousePointer size={16} />
        <span>Clique nas casas para posicionar as notas. Clique novamente para marcar como "não tocar".</span>
      </div>
      
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="mx-auto">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Fundo */}
        <rect 
          x={MARGIN_X} 
          y={MARGIN_Y} 
          width={NUM_FRETS * FRET_SPACING} 
          height={(NUM_STRINGS - 1) * STRING_SPACING} 
          fill="#1e293b" 
          stroke="#334155" 
          strokeWidth="2"
          rx="4"
        />

        {/* Marcadores de casa (dots) */}
        {[3, 5, 7, 9].map(fret => (
          <circle
            key={fret}
            cx={MARGIN_X + fret * FRET_SPACING - FRET_SPACING / 2}
            cy={MARGIN_Y + ((NUM_STRINGS - 1) * STRING_SPACING) / 2}
            r="4"
            fill="#475569"
          />
        ))}

        {/* Linhas de traste (frets) */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <line
            key={i}
            x1={MARGIN_X + i * FRET_SPACING}
            y1={MARGIN_Y}
            x2={MARGIN_X + i * FRET_SPACING}
            y2={MARGIN_Y + (NUM_STRINGS - 1) * STRING_SPACING}
            stroke={i === 0 ? '#64748b' : '#334155'}
            strokeWidth={i === 0 ? 4 : 2}
          />
        ))}

        {/* Cordas */}
        {Array.from({ length: NUM_STRINGS }).map((_, i) => (
          <g key={i}>
            {/* Linha da corda */}
            <line
              x1={MARGIN_X}
              y1={MARGIN_Y + i * STRING_SPACING}
              x2={MARGIN_X + NUM_FRETS * FRET_SPACING}
              y2={MARGIN_Y + i * STRING_SPACING}
              stroke={isRootString(i) ? '#f59e0b' : '#64748b'}
              strokeWidth={isRootString(i) ? 3 : 2}
            />
            
            {/* Nome da corda */}
            <text
              x={MARGIN_X - 25}
              y={MARGIN_Y + i * STRING_SPACING + 5}
              className="fill-slate-400 text-sm font-bold"
              textAnchor="middle"
            >
              {stringNames[i]}
            </text>

            {/* Símbolo de tônica */}
            {isRootString(i) && (
              <text
                x={MARGIN_X - 40}
                y={MARGIN_Y + i * STRING_SPACING + 5}
                className="fill-amber-500 text-xs font-bold"
                textAnchor="middle"
              >
                ●
              </text>
            )}
          </g>
        ))}

        {/* Números das casas */}
        {Array.from({ length: NUM_FRETS }).map((_, i) => (
          <text
            key={i}
            x={MARGIN_X + i * FRET_SPACING + FRET_SPACING / 2}
            y={MARGIN_Y - 15}
            className="fill-slate-500 text-xs font-bold"
            textAnchor="middle"
          >
            {i}
          </text>
        ))}

        {/* Áreas clicáveis e marcadores */}
        {Array.from({ length: NUM_STRINGS }).map((_, stringIndex) =>
          Array.from({ length: NUM_FRETS + 1 }).map((_, fret) => {
            const isSelected = frets[stringIndex] === fret;
            const isMuted = frets[stringIndex] === -1;
            
            return (
              <g key={`${stringIndex}-${fret}`}>
                {/* Área clicável */}
                <rect
                  x={MARGIN_X + fret * FRET_SPACING - FRET_SPACING / 2}
                  y={MARGIN_Y + stringIndex * STRING_SPACING - STRING_SPACING / 2}
                  width={FRET_SPACING}
                  height={STRING_SPACING}
                  fill="transparent"
                  className="cursor-pointer hover:fill-slate-700/30 transition-all"
                  onClick={() => handleFretClick(stringIndex, fret)}
                />

                {/* Marcador de nota selecionada */}
                {isSelected && (
                  <g>
                    <circle
                      cx={MARGIN_X + (fret === 0 ? 0 : fret * FRET_SPACING - FRET_SPACING / 2)}
                      cy={MARGIN_Y + stringIndex * STRING_SPACING}
                      r="12"
                      fill={isRootString(stringIndex) ? '#f59e0b' : '#3b82f6'}
                      stroke="white"
                      strokeWidth="2"
                      className="pointer-events-none"
                      filter="url(#glow)"
                    />
                    {/* Número do dedo */}
                    {fingers && fingers[stringIndex] > 0 && (
                      <text
                        x={MARGIN_X + (fret === 0 ? 0 : fret * FRET_SPACING - FRET_SPACING / 2)}
                        y={MARGIN_Y + stringIndex * STRING_SPACING + 5}
                        className="fill-white text-xs font-bold pointer-events-none"
                        textAnchor="middle"
                      >
                        {fingers[stringIndex]}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* Marcador de "X" para cordas não tocadas */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) {
            return (
              <g key={`muted-${stringIndex}`}>
                <line
                  x1={MARGIN_X - 15}
                  y1={MARGIN_Y + stringIndex * STRING_SPACING - 8}
                  x2={MARGIN_X - 5}
                  y2={MARGIN_Y + stringIndex * STRING_SPACING + 8}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1={MARGIN_X - 15}
                  y1={MARGIN_Y + stringIndex * STRING_SPACING + 8}
                  x2={MARGIN_X - 5}
                  y2={MARGIN_Y + stringIndex * STRING_SPACING - 8}
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            );
          }
          return null;
        })}
      </svg>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white"></div>
          <span>Tônica</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
          <span>Outras notas</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <line x1="2" y1="2" x2="14" y2="14" stroke="#ef4444" strokeWidth="2"/>
            <line x1="2" y1="14" x2="14" y2="2" stroke="#ef4444" strokeWidth="2"/>
          </svg>
          <span>Não tocar</span>
        </div>
      </div>
    </div>
  );
};

export const AdminPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Shapes management
  const [shapeTypes, setShapeTypes] = useState<Array<{ id: string; name: string; shapes: ChordShape[] }>>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [editingShape, setEditingShape] = useState<ChordShape | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadShapes();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShapeTypes([]);
      setSelectedType(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer logout');
    }
  };

  const loadShapes = async () => {
    setLoading(true);
    try {
      const allShapes = await getAllShapeTypes();
      setShapeTypes(allShapes.map(s => ({ id: s.id, name: s.data.name, shapes: s.data.shapes })));
    } catch (err) {
      console.error('Erro ao carregar shapes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShapes = async () => {
    if (!selectedType) return;

    const typeData = shapeTypes.find(t => t.id === selectedType);
    if (!typeData) return;

    setLoading(true);
    setError('');
    try {
      await updateShapes(selectedType, typeData.shapes, typeData.name);
      
      // Limpar cache para forçar recarregamento nos modais
      clearCache();
      
      // Recarregar shapes para garantir sincronização
      await loadShapes();
      
      setError('✅ Shapes salvos com sucesso! As alterações já estão disponíveis nos modais.');
      setTimeout(() => setError(''), 3000);
    } catch (err: any) {
      setError(`❌ Erro ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShape = (index: number) => {
    const typeData = shapeTypes.find(t => t.id === selectedType);
    if (!typeData) return;

    setEditingShape({ ...typeData.shapes[index] });
    setEditingIndex(index);
  };

  const handleDeleteShape = (index: number) => {
    if (!confirm('Tem certeza que deseja deletar este shape?')) return;

    setShapeTypes(prev => prev.map(type => {
      if (type.id === selectedType) {
        return {
          ...type,
          shapes: type.shapes.filter((_, i) => i !== index)
        };
      }
      return type;
    }));
  };

  const handleAddShape = () => {
    setEditingShape({
      name: '',
      baseString: 6,
      frets: [0, 0, 0, 0, 0, 0],
      fingers: [0, 0, 0, 0, 0, 0],
      rootFretOffset: 0
    });
    setEditingIndex(-1); // -1 significa novo
  };

  const handleSaveEditedShape = () => {
    if (!editingShape || selectedType === null) return;

    setShapeTypes(prev => prev.map(type => {
      if (type.id === selectedType) {
        const newShapes = [...type.shapes];
        if (editingIndex === -1) {
          // Adicionar novo
          newShapes.push(editingShape);
        } else if (editingIndex !== null) {
          // Editar existente
          newShapes[editingIndex] = editingShape;
        }
        return { ...type, shapes: newShapes };
      }
      return type;
    }));

    setEditingShape(null);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingShape(null);
    setEditingIndex(null);
  };

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <LogIn className="text-brand-500" size={32} />
            <h1 className="text-2xl font-bold text-white">Admin - Shapes CAGED</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  const selectedTypeData = shapeTypes.find(t => t.id === selectedType);

  return (
    <div className="pb-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Administração de Shapes</h1>
          <p className="text-slate-400 text-sm">Gerencie os diagramas CAGED dos acordes</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm">Sair</span>
        </button>
      </div>

      {/* User Info */}
      <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 mb-6">
        <p className="text-sm text-slate-400">
          Logado como: <span className="text-white font-medium">{user.email}</span>
        </p>
      </div>

      {/* Notificação de Sucesso/Erro */}
      {error && (
        <div className={`p-4 rounded-lg mb-6 border ${
          error.startsWith('✅') 
            ? 'bg-green-500/10 border-green-500 text-green-400' 
            : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tipo de Acorde Selection */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 mb-6">
        <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Tipo de Acorde
        </label>
        <div className="grid grid-cols-2 gap-2">
          {shapeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-3 rounded-lg text-sm font-medium text-left border transition-all ${
                selectedType === type.id
                  ? 'bg-brand-600 border-brand-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <div>{type.name}</div>
              <div className="text-xs opacity-60 mt-1">{type.shapes.length} shapes</div>
            </button>
          ))}
        </div>
      </div>

      {/* Shapes List */}
      {selectedTypeData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {selectedTypeData.name}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleAddShape}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Adicionar Shape
              </button>
              <button
                onClick={handleSaveShapes}
                disabled={loading}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>

          {/* Shape Cards */}
          <div className="space-y-3">
            {selectedTypeData.shapes.map((shape, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-2">{shape.name || `Shape ${index + 1}`}</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Base String: </span>
                        <span className="text-white font-mono">{shape.baseString}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Root Offset: </span>
                        <span className="text-white font-mono">{shape.rootFretOffset || 0}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Frets: </span>
                        <span className="text-white font-mono">[{shape.frets.join(', ')}]</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400">Fingers: </span>
                        <span className="text-white font-mono">[{shape.fingers?.join(', ') || 'N/A'}]</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditShape(index)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteShape(index)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shape Editor Modal */}
      {editingShape && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingIndex === -1 ? 'Novo Shape' : 'Editar Shape'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome do Shape</label>
                <input
                  type="text"
                  value={editingShape.name || ''}
                  onChange={(e) => setEditingShape({ ...editingShape, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 focus:outline-none"
                  placeholder="Ex: Formato de C (CAGED)"
                />
              </div>

              {/* Base String */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Corda Base (Tônica)</label>
                <select
                  value={editingShape.baseString}
                  onChange={(e) => setEditingShape({ ...editingShape, baseString: parseInt(e.target.value) as 6 | 5 | 4 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value={6}>6 - Mi (E)</option>
                  <option value={5}>5 - Lá (A)</option>
                  <option value={4}>4 - Ré (D)</option>
                </select>
              </div>

              {/* Root Fret Offset */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Root Fret Offset</label>
                <input
                  type="number"
                  value={editingShape.rootFretOffset || 0}
                  onChange={(e) => setEditingShape({ ...editingShape, rootFretOffset: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-brand-500 focus:outline-none"
                  min={0}
                  max={12}
                />
              </div>

              {/* Editor Visual de Frets */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  Editor Visual - Clique no braço do violão
                </label>
                <VisualFretboardEditor
                  frets={editingShape.frets}
                  fingers={editingShape.fingers}
                  onFretsChange={(newFrets) => setEditingShape({ ...editingShape, frets: newFrets })}
                  baseString={editingShape.baseString}
                />
              </div>

              {/* Frets - Edição Numérica (Backup) */}
              <details className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <summary className="cursor-pointer text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  ⚙️ Edição Manual (Avançado)
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-2">
                      Frets (casas) - 6 cordas [E, A, D, G, B, e] | -1 = não tocar
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {editingShape.frets.map((fret, idx) => (
                        <div key={idx}>
                          <label className="text-xs text-slate-500 block mb-1 text-center">
                            {['E', 'A', 'D', 'G', 'B', 'e'][idx]}
                          </label>
                          <input
                            type="number"
                            value={fret}
                            onChange={(e) => {
                              const newFrets = [...editingShape.frets];
                              newFrets[idx] = parseInt(e.target.value) || 0;
                              setEditingShape({ ...editingShape, frets: newFrets });
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white text-center focus:border-brand-500 focus:outline-none text-sm"
                            min={-1}
                            max={24}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              {/* Fingers */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Dedos - 6 cordas [E, A, D, G, B, e] | 0 = solta/pestana
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {(editingShape.fingers || [0, 0, 0, 0, 0, 0]).map((finger, idx) => (
                    <div key={idx}>
                      <label className="text-xs text-slate-500 block mb-1 text-center">
                        {['E', 'A', 'D', 'G', 'B', 'e'][idx]}
                      </label>
                      <input
                        type="number"
                        value={finger}
                        onChange={(e) => {
                          const newFingers = [...(editingShape.fingers || [0, 0, 0, 0, 0, 0])];
                          newFingers[idx] = parseInt(e.target.value) || 0;
                          setEditingShape({ ...editingShape, fingers: newFingers });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-white text-center focus:border-brand-500 focus:outline-none"
                        min={0}
                        max={4}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditedShape}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Salvar Shape
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

