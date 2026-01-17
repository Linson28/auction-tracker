
import React, { useMemo, useState } from 'react';
import { Player, PlayerStatus } from '../types';
import { Search, Filter, SortAsc, SortDesc, Hash, User } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchNo: string;
  setSearchNo: (q: string) => void;
  filterStatus: PlayerStatus | 'All';
  setFilterStatus: (s: PlayerStatus | 'All') => void;
  sortBy: 'name' | 'points';
  setSortBy: (s: 'name' | 'points') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (o: 'asc' | 'desc') => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onSelectPlayer,
  searchQuery,
  setSearchQuery,
  searchNo,
  setSearchNo,
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}) => {
  // Use temporary state for inputs so "Search" button acts as the trigger
  const [tempName, setTempName] = useState(searchQuery);
  const [tempNo, setTempNo] = useState(searchNo);

  const handleSearchTrigger = () => {
    setSearchQuery(tempName);
    setSearchNo(tempNo);
  };

  const filteredPlayers = useMemo(() => {
    let result = players.filter(p => {
      const qName = searchQuery.toLowerCase().trim();
      const qNo = searchNo.trim();

      const nameMatch = qName === '' || p.name.toLowerCase().includes(qName);
      // Exact match for player number to avoid returning 101 when searching for 1
      const noMatch = qNo === '' || (p.playerNo && p.playerNo === qNo);

      return nameMatch && noMatch;
    });

    if (filterStatus !== 'All') {
      result = result.filter(p => p.status === filterStatus);
    }

    result.sort((a, b) => {
      const valA = sortBy === 'name' ? a.name.toLowerCase() : a.preassignedPoints;
      const valB = sortBy === 'name' ? b.name.toLowerCase() : b.preassignedPoints;
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [players, searchQuery, searchNo, filterStatus, sortBy, sortOrder]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Search and Filters Sticky Header */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-4 sticky top-0 z-10 shadow-sm">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-8 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Player Name..."
              className="w-full pl-9 pr-3 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
            />
          </div>
          <div className="col-span-4 relative">
            <Hash className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="No."
              className="w-full pl-7 pr-2 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm"
              value={tempNo}
              onChange={(e) => setTempNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTrigger()}
            />
          </div>
        </div>

        <button 
          onClick={handleSearchTrigger}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm uppercase shadow-lg shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Search size={16} />
          Search
        </button>

        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          <FilterChip label="All" active={filterStatus === 'All'} onClick={() => setFilterStatus('All')} />
          <FilterChip label="Available" active={filterStatus === 'Available'} onClick={() => setFilterStatus('Available')} />
          <FilterChip label="Sold" active={filterStatus === 'SoldOther'} onClick={() => setFilterStatus('SoldOther')} color="red" />
          <FilterChip label="Bought" active={filterStatus === 'BoughtUs'} onClick={() => setFilterStatus('BoughtUs')} color="green" />
        </div>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex gap-2">
             <button 
              onClick={() => {
                if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('name'); setSortOrder('asc'); }
              }}
              className={`px-3 py-1 rounded-full flex items-center gap-1 ${sortBy === 'name' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
            </button>
            <button 
              onClick={() => {
                if (sortBy === 'points') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortBy('points'); setSortOrder('desc'); }
              }}
              className={`px-3 py-1 rounded-full flex items-center gap-1 ${sortBy === 'points' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'}`}
            >
              Points {sortBy === 'points' && (sortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
            </button>
          </div>
          <span>{filteredPlayers.length} results</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {filteredPlayers.map(player => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
              player.status === 'BoughtUs' 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-emerald-100' 
                : player.status === 'SoldOther'
                ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-rose-100'
                : 'bg-white border-white border-transparent shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {player.playerNo && <span className="bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">{player.playerNo}</span>}
                  <h3 className="text-lg font-bold truncate leading-tight">{player.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {player.parishName && <span className="text-xs font-bold text-slate-500 opacity-80">{player.parishName}</span>}
                  {player.reasons && <span className="text-[10px] font-medium text-slate-400 italic truncate max-w-[200px]">{player.reasons}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-extrabold">{player.preassignedPoints}</div>
                <div className="text-[10px] uppercase tracking-tighter font-bold opacity-50">Points</div>
              </div>
            </div>
          </button>
        ))}
        {filteredPlayers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">No players found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterChip = ({ label, active, onClick, color = 'blue' }: { label: string, active: boolean, onClick: () => void, color?: 'blue' | 'red' | 'green' }) => {
  const activeClasses = {
    blue: 'bg-blue-600 text-white',
    red: 'bg-rose-600 text-white',
    green: 'bg-emerald-600 text-white'
  };
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-black transition-all uppercase ${
        active 
          ? activeClasses[color] 
          : 'bg-white text-slate-400 border border-slate-200'
      }`}
    >
      {label}
    </button>
  );
};

export default PlayerList;
