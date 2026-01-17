
import React, { useState } from 'react';
import { Player } from '../types';
import { X, Check, Users, RotateCcw, ShieldCheck } from 'lucide-react';

interface ActionPanelProps {
  player: Player;
  onClose: () => void;
  onAction: (status: Player['status'], price?: number) => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ player, onClose, onAction }) => {
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [actualPrice, setActualPrice] = useState<string>(player.preassignedPoints.toString());

  const handleConfirmBought = () => {
    const price = parseFloat(actualPrice);
    if (isNaN(price)) return;
    onAction('BoughtUs', price);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="px-6 py-6 bg-slate-900 text-white relative">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-white/10 rounded-full active:scale-90">
            <X size={24} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            {player.playerNo && <span className="text-xs font-black bg-blue-500 px-2 py-0.5 rounded text-white">#{player.playerNo}</span>}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Player Details</span>
          </div>
          <h2 className="text-3xl font-black truncate pr-10">{player.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Points</p>
              <p className="text-3xl font-black text-blue-400">{player.preassignedPoints}</p>
            </div>
            {player.parishName && (
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Parish</p>
                <p className="text-lg font-bold truncate">{player.parishName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showPriceInput ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ActionButton 
                  icon={<Users className="w-6 h-6" />}
                  label="Sold Other"
                  sub="Mark Red"
                  color="rose"
                  onClick={() => { onAction('SoldOther'); onClose(); }}
                />
                <ActionButton 
                  icon={<ShieldCheck className="w-6 h-6" />}
                  label="Bought Us"
                  sub="Mark Green"
                  color="emerald"
                  onClick={() => setShowPriceInput(true)}
                />
              </div>
              <button 
                onClick={() => { onAction('Available'); onClose(); }}
                className="w-full py-4 flex items-center justify-center gap-2 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
              >
                <RotateCcw size={18} />
                Undo / Reset
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in zoom-in duration-200">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Final Purchase Price</p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setActualPrice(Math.max(0, parseFloat(actualPrice) - 1).toString())}
                    className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold active:bg-slate-200"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    autoFocus
                    className="w-32 text-center text-5xl font-black bg-transparent border-none focus:ring-0 p-0"
                    value={actualPrice}
                    onChange={(e) => setActualPrice(e.target.value)}
                  />
                  <button 
                    onClick={() => setActualPrice((parseFloat(actualPrice) + 1).toString())}
                    className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold active:bg-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPriceInput(false)}
                  className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-600 font-black text-lg active:scale-[0.98]"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleConfirmBought}
                  className="flex-[2] py-5 rounded-2xl bg-emerald-600 text-white font-black text-lg shadow-xl shadow-emerald-200 active:scale-[0.98]"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {player.reasons && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-[10px] uppercase font-bold text-amber-500 mb-1">Reasons</p>
                <p className="text-sm text-amber-800 font-medium">{player.reasons}</p>
              </div>
            )}
            {player.notes && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-600 font-medium italic">"{player.notes}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, sub, color, onClick }: any) => {
  const colors: any = {
    rose: 'bg-rose-50 border-rose-200 text-rose-700 active:bg-rose-100',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 active:bg-emerald-100',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${colors[color]} group`}
    >
      <div className={`p-3 rounded-2xl mb-3 ${color === 'rose' ? 'bg-rose-200' : 'bg-emerald-200'} group-active:scale-90 transition-transform`}>
        {icon}
      </div>
      <span className="font-black text-sm uppercase leading-tight">{label}</span>
      <span className="text-[10px] font-bold opacity-60">{sub}</span>
    </button>
  );
};

export default ActionPanel;
