
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, AuctionState, PlayerStatus, ImportPreviewData, ImportIssue } from './types';
import { INITIAL_STATE, COLUMN_MAPPINGS } from './constants';
import PlayerList from './components/PlayerList';
import ActionPanel from './components/ActionPanel';
import ImportModal from './components/ImportModal';
import { parseExcelFile, exportAuctionData } from './utils/excelUtils';
import { 
  Plus, 
  LayoutDashboard, 
  Users, 
  Settings, 
  ChevronRight, 
  Wallet, 
  Download, 
  FileSpreadsheet,
  AlertCircle,
  Undo2
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AuctionState>(() => {
    const saved = localStorage.getItem('auction_tracker_v1');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'myteam' | 'setup'>('setup');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchNo, setSearchNo] = useState('');
  const [filterStatus, setFilterStatus] = useState<PlayerStatus | 'All'>('Available');
  const [sortBy, setSortBy] = useState<'name' | 'points'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('auction_tracker_v1', JSON.stringify(state));
  }, [state]);

  // Handle body scroll locking for mobile
  useEffect(() => {
    if (selectedPlayer || importPreview) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [selectedPlayer, importPreview]);

  // Derived Values
  const spentPoints = useMemo(() => {
    return state.players
      .filter(p => p.status === 'BoughtUs')
      .reduce((acc, p) => acc + (p.actualPrice || 0), 0);
  }, [state.players]);

  const remainingPoints = state.totalBudget - spentPoints;
  const myPlayers = state.players.filter(p => p.status === 'BoughtUs');
  const recentlyHandled = state.players
    .filter(p => p.status !== 'Available' && p.handledAt)
    .sort((a, b) => (b.handledAt || 0) - (a.handledAt || 0))
    .slice(0, 5);

  // Helper to find field in row based on flexible mapping
  const getFieldValue = (row: any, fieldKeys: string[]) => {
    const rowKeys = Object.keys(row);
    for (const key of fieldKeys) {
      const match = rowKeys.find(rk => rk.toLowerCase().trim() === key.toLowerCase().trim());
      if (match) return row[match];
    }
    return undefined;
  };

  // Actions
  const handleStartAuction = (team: string, budget: number) => {
    setState(prev => ({ ...prev, teamName: team, totalBudget: budget, isStarted: true }));
    setActiveTab('dashboard');
  };

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const data = await parseExcelFile(file);
      const players: Player[] = [];
      const issues: ImportIssue[] = [];
      const seenNamesInCurrentImport = new Set<string>();
      const existingNames = new Set(state.players.map(p => p.name.toLowerCase().trim()));

      data.forEach((row: any, idx) => {
        if (!row || Object.keys(row).length === 0) return;

        const rawPlayerNo = getFieldValue(row, COLUMN_MAPPINGS.playerNo);
        const playerNo = rawPlayerNo !== undefined ? String(rawPlayerNo).trim() : '';

        const rawName = getFieldValue(row, COLUMN_MAPPINGS.name);
        const name = rawName ? String(rawName).trim() : '';
        
        const rawParish = getFieldValue(row, COLUMN_MAPPINGS.parishName);
        const parishName = rawParish !== undefined ? String(rawParish).trim() : '';

        const rawPoints = getFieldValue(row, COLUMN_MAPPINGS.preassignedPoints);
        const points = typeof rawPoints === 'number' ? rawPoints : parseFloat(String(rawPoints || ''));
        
        const reasons = String(getFieldValue(row, COLUMN_MAPPINGS.reasons) || '').trim();
        const role = String(getFieldValue(row, COLUMN_MAPPINGS.role) || '').trim();
        const notes = String(getFieldValue(row, COLUMN_MAPPINGS.notes) || '').trim();

        const rowNum = idx + 1;

        if (!name) {
          issues.push({ row: rowNum, field: 'name', message: 'Row ' + rowNum + ': Missing player name', type: 'error' });
        }
        
        if (isNaN(points)) {
          issues.push({ row: rowNum, field: 'points', message: 'Row ' + rowNum + ': Missing or invalid points', type: 'error' });
        }

        if (name) {
          const lowerName = name.toLowerCase();
          if (seenNamesInCurrentImport.has(lowerName) || existingNames.has(lowerName)) {
            issues.push({ row: rowNum, field: 'name', message: 'Duplicate name: ' + name, type: 'warning' });
          }
          seenNamesInCurrentImport.add(lowerName);
        }

        if (name || !isNaN(points)) {
          players.push({
            id: `p-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            playerNo,
            name: name || 'Unknown Player',
            parishName,
            preassignedPoints: isNaN(points) ? 0 : points,
            status: 'Available',
            role,
            reasons,
            notes,
          });
        }
      });

      if (players.length === 0 && issues.length === 0) {
        alert("Headers not recognized. Please check columns like 'Player Name' and 'Points'.");
      } else {
        setImportPreview({ players, issues });
      }
    } catch (err) {
      console.error("Import Error:", err);
      alert("Error parsing file.");
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  };

  const confirmImport = (newPlayers: Player[]) => {
    setState(prev => ({ ...prev, players: [...prev.players, ...newPlayers] }));
    setImportPreview(null);
  };

  const updatePlayerStatus = useCallback((status: PlayerStatus, price?: number) => {
    if (!selectedPlayer) return;

    setState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === selectedPlayer.id 
          ? { ...p, status, actualPrice: price, handledAt: Date.now() } 
          : p
      )
    }));
    setSelectedPlayer(null);
  }, [selectedPlayer]);

  const handleExport = () => {
    exportAuctionData(state.players, state.teamName, state.totalBudget, spentPoints);
  };

  useEffect(() => {
    if (!state.isStarted) setActiveTab('setup');
  }, [state.isStarted]);

  const BudgetSummary = () => (
    <div className={`p-5 rounded-3xl shadow-lg transition-colors ${remainingPoints < 0 ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
      <div className="flex items-center gap-2 mb-4 opacity-70">
        <Wallet size={16} />
        <span className="text-xs font-black uppercase tracking-widest">Points Tracker</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase opacity-60">Total Budget</p>
          <p className="text-2xl font-black">{state.totalBudget}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase opacity-60">Spent</p>
          <p className="text-2xl font-black">{spentPoints}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold uppercase opacity-60">Remaining Balance</p>
            <p className={`text-4xl font-black ${remainingPoints < 0 ? 'animate-pulse' : ''}`}>
              {remainingPoints}
            </p>
          </div>
          {remainingPoints < 0 && (
            <div className="flex items-center gap-1 text-xs font-black bg-white/20 px-2 py-1 rounded-full">
              <AlertCircle size={14} />
              OVER BUDGET
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (activeTab === 'setup' && !state.isStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 max-w-lg mx-auto">
        <header className="py-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900">Auction Tracker</h1>
          <p className="text-slate-500 font-medium mt-2">Set up your team and budget to start</p>
        </header>

        <main className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Team Name</label>
              <input
                type="text"
                placeholder="Enter team name..."
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                value={state.teamName}
                onChange={(e) => setState(prev => ({ ...prev, teamName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Total Points Budget</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-2xl"
                value={state.totalBudget || ''}
                onChange={(e) => setState(prev => ({ ...prev, totalBudget: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200 text-center relative group active:bg-blue-100 transition-colors">
            <FileSpreadsheet size={32} className="mx-auto text-blue-400 mb-2" />
            <h3 className="font-bold text-blue-700">Import Players List</h3>
            <p className="text-xs text-blue-500 mt-1">Upload Excel/CSV</p>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleImportFileSelect}
              disabled={importLoading}
            />
            {importLoading && <div className="absolute inset-0 bg-blue-50/80 flex items-center justify-center font-bold">Importing...</div>}
          </div>

          {state.players.length > 0 && (
            <div className="text-center">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                {state.players.length} Players Loaded
              </span>
              <button 
                onClick={() => { if(confirm("Clear current player list?")) setState(prev => ({ ...prev, players: [] })); }}
                className="block mx-auto mt-2 text-[10px] font-black uppercase text-rose-400"
              >
                Clear List
              </button>
            </div>
          )}
        </main>

        <footer className="mt-8">
          <button
            onClick={() => handleStartAuction(state.teamName, state.totalBudget)}
            disabled={!state.teamName || state.totalBudget <= 0}
            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            START AUCTION
          </button>
        </footer>

        {importPreview && (
          <ImportModal 
            previewData={importPreview} 
            onConfirm={confirmImport} 
            onCancel={() => setImportPreview(null)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-lg mx-auto">
      <main className="flex-1 overflow-hidden pb-20">
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-8 h-full overflow-y-auto no-scrollbar">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-slate-900">{state.teamName}</h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Session</p>
              </div>
              <button 
                onClick={() => setActiveTab('setup')}
                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 active:bg-slate-50"
              >
                <Settings size={20} />
              </button>
            </header>

            <BudgetSummary />

            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
                <button 
                  onClick={() => setActiveTab('list')}
                  className="text-blue-600 font-bold text-sm"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {recentlyHandled.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      p.status === 'BoughtUs' ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-rose-50 border-rose-500 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        p.status === 'BoughtUs' ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'
                      }`}>
                        {p.playerNo || p.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900 truncate max-w-[150px]">{p.name}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'BoughtUs' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {p.status === 'BoughtUs' ? 'Bought' : 'Sold'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">{p.status === 'BoughtUs' ? p.actualPrice : p.preassignedPoints}</p>
                      <p className="text-[10px] font-bold text-slate-400">POINTS</p>
                    </div>
                  </button>
                ))}
                {recentlyHandled.length === 0 && (
                  <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 font-medium italic">
                    No activity yet
                  </div>
                )}
              </div>
            </section>

            <section className="pb-10">
               <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 flex items-center justify-between group active:scale-[0.98] transition-transform"
                    onClick={() => setActiveTab('list')}>
                  <div>
                    <h3 className="text-xl font-black">Open Player List</h3>
                    <p className="text-blue-100 text-sm font-medium">Search by Name or No.</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <ChevronRight size={24} />
                  </div>
               </div>
            </section>
          </div>
        )}

        {activeTab === 'list' && (
          <PlayerList 
            players={state.players}
            onSelectPlayer={setSelectedPlayer}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchNo={searchNo}
            setSearchNo={setSearchNo}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        )}

        {activeTab === 'myteam' && (
          <div className="p-6 space-y-6 h-full overflow-y-auto no-scrollbar">
            <header>
              <h1 className="text-3xl font-black text-slate-900">Our Team</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{myPlayers.length} Players Bought</p>
            </header>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Cost</p>
                  <p className="text-2xl font-black text-slate-900">
                    {myPlayers.length > 0 ? Math.round(spentPoints / myPlayers.length) : 0}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</p>
                  <p className="text-2xl font-black text-slate-900">
                    {myPlayers.length > 0 
                      ? Math.round((myPlayers.reduce((acc, p) => acc + p.preassignedPoints, 0) / spentPoints) * 100) 
                      : 0}%
                  </p>
               </div>
            </div>

            <div className="space-y-4">
              {myPlayers.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                   <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {p.playerNo && <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded">#{p.playerNo}</span>}
                        <h4 className="font-bold text-lg text-slate-900">{p.name}</h4>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase text-slate-400">Paid: {p.actualPrice}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400">•</span>
                        <span className="text-[10px] font-black uppercase text-slate-400">Planned: {p.preassignedPoints}</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => setSelectedPlayer(p)}
                    className="p-3 text-emerald-600 bg-emerald-50 rounded-2xl active:bg-emerald-100"
                   >
                     <Undo2 size={20} />
                   </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleExport}
              className="w-full mt-10 py-5 bg-slate-900 text-white rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
            >
              <Download size={24} />
              EXPORT RESULTS
            </button>
          </div>
        )}

        {activeTab === 'setup' && state.isStarted && (
           <div className="p-6 space-y-6 h-full overflow-y-auto no-scrollbar">
             <header>
               <h1 className="text-3xl font-black text-slate-900">Settings</h1>
             </header>

             <div className="space-y-4">
               <div className="p-6 bg-white rounded-3xl border border-slate-200">
                 <h3 className="text-sm font-black uppercase text-slate-900 mb-4">Auction Summary</h3>
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span className="text-slate-500 font-medium">Team Name</span>
                     <span className="font-bold">{state.teamName}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-500 font-medium">Budget</span>
                     <span className="font-bold">{state.totalBudget}</span>
                   </div>
                 </div>
               </div>

               <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200 text-center relative group active:bg-blue-100 transition-colors">
                  <FileSpreadsheet size={32} className="mx-auto text-blue-400 mb-2" />
                  <h3 className="font-bold text-blue-700">Import More Players</h3>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleImportFileSelect}
                    disabled={importLoading}
                  />
                  {importLoading && <div className="absolute inset-0 bg-blue-50/80 flex items-center justify-center font-bold">Importing...</div>}
                </div>

                <button
                  onClick={handleExport}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Download size={20} />
                  EXPORT STATUS
                </button>

                <button
                  onClick={() => { if(confirm("Are you sure? All data will be lost.")) { setState(INITIAL_STATE); setActiveTab('setup'); } }}
                  className="w-full py-4 text-rose-600 font-black text-xs uppercase"
                >
                  Reset Session
                </button>
             </div>
           </div>
        )}
      </main>

      {selectedPlayer && (
        <ActionPanel 
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onAction={updatePlayerStatus}
        />
      )}

      {importPreview && (
        <ImportModal 
          previewData={importPreview} 
          onConfirm={confirmImport} 
          onCancel={() => setImportPreview(null)} 
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center max-w-lg mx-auto z-40">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dash" />
        <NavButton active={activeTab === 'list'} onClick={() => setActiveTab('list')} icon={<Users />} label="Players" />
        <NavButton active={activeTab === 'myteam'} onClick={() => setActiveTab('myteam')} icon={<Plus />} label="Bought" isPrimary />
        <NavButton active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<Settings />} label="Settings" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label, isPrimary = false }: any) => {
  if (isPrimary) {
    return (
      <button 
        onClick={onClick}
        className={`w-14 h-14 -mt-10 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-90 ${active ? 'bg-blue-700 text-white' : 'bg-slate-900 text-white'}`}
      >
        {icon}
      </button>
    );
  }
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${active ? 'text-blue-600' : 'text-slate-400'}`}
    >
      <div className={active ? 'scale-110 transition-transform' : ''}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
};

export default App;
