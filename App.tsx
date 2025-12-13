import React, { useState } from 'react';
import { ScalesPage } from './pages/ScalesPage';
import { ChordsPage } from './pages/ChordsPage';
import { HarmonicFieldPage } from './pages/HarmonicFieldPage';
import { PageView } from './types';
import { Music, Grid, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.SCALES);

  const renderPage = () => {
    switch(currentPage) {
      case PageView.SCALES: return <ScalesPage />;
      case PageView.CHORDS: return <ChordsPage />;
      case PageView.HARMONY: return <HarmonicFieldPage />;
      default: return <ScalesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      
      {/* Main Content Area */}
      <main className="w-full max-w-md flex-1 p-4 pb-0">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-20 px-2 pb-2">
          
          <button 
            onClick={() => setCurrentPage(PageView.SCALES)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage === PageView.SCALES ? 'text-brand-500' : 'text-slate-500'}`}
          >
            <Music size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Escalas</span>
          </button>

          <button 
            onClick={() => setCurrentPage(PageView.CHORDS)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage === PageView.CHORDS ? 'text-brand-500' : 'text-slate-500'}`}
          >
            <Layers size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Acordes</span>
          </button>

          <button 
            onClick={() => setCurrentPage(PageView.HARMONY)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentPage === PageView.HARMONY ? 'text-brand-500' : 'text-slate-500'}`}
          >
            <Grid size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Campo H.</span>
          </button>

        </div>
      </nav>
    </div>
  );
};

export default App;
