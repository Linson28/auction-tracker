
import React, { useMemo } from 'react';
import { Player, ImportIssue } from '../types';
import { X, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  previewData: { players: Player[]; issues: ImportIssue[] };
  onConfirm: (players: Player[]) => void;
  onCancel: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ previewData, onConfirm, onCancel }) => {
  const errors = previewData.issues.filter(i => i.type === 'error');
  const warnings = previewData.issues.filter(i => i.type === 'warning');

  const canImport = errors.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Import Preview</h2>
            <p className="text-xs text-slate-400 font-bold">{previewData.players.length} players found</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${errors.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {errors.length > 0 ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
              <div>
                <p className="text-xs font-black uppercase opacity-70">Errors</p>
                <p className="text-lg font-black">{errors.length}</p>
              </div>
            </div>
            <div className={`p-4 rounded-2xl flex items-center gap-3 ${warnings.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
              <AlertTriangle size={24} />
              <div>
                <p className="text-xs font-black uppercase opacity-70">Duplicates</p>
                <p className="text-lg font-black">{warnings.length}</p>
              </div>
            </div>
          </div>

          {(errors.length > 0 || warnings.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Issues</h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 divide-y divide-slate-200 overflow-hidden max-h-40 overflow-y-auto">
                {[...errors, ...warnings].map((issue, idx) => (
                  <div key={idx} className="p-3 flex items-start gap-3">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${issue.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {issue.type}
                    </span>
                    <p className="text-xs font-bold text-slate-700">{issue.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1">Data Preview</h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 font-black text-slate-500 uppercase">No.</th>
                    <th className="px-3 py-3 font-black text-slate-500 uppercase">Name</th>
                    <th className="px-3 py-3 font-black text-slate-500 uppercase">Parish</th>
                    <th className="px-3 py-3 font-black text-slate-500 uppercase">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.players.slice(0, 15).map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-bold text-slate-400">{p.playerNo || '-'}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{p.name}</td>
                      <td className="px-3 py-2 text-slate-600">{p.parishName || '-'}</td>
                      <td className="px-3 py-2 font-black text-blue-600">{p.preassignedPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.players.length > 15 && (
                <div className="p-3 text-center text-[10px] font-bold text-slate-400 bg-slate-50 italic">
                  Showing first 15 of {previewData.players.length} players
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black active:scale-[0.98]"
          >
            CANCEL
          </button>
          <button 
            onClick={() => onConfirm(previewData.players)}
            disabled={!canImport}
            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
          >
            IMPORT PLAYERS
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
