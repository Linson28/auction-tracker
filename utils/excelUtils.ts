
import * as XLSX from 'xlsx';
import { Player, PlayerStatus } from '../types';

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const exportAuctionData = (
  players: Player[], 
  teamName: string, 
  budget: number, 
  spent: number
) => {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Player Results
  const playerRows = players.map(p => ({
    'Player Name': p.name,
    'Status': p.status === 'BoughtUs' ? 'Bought by Us' : p.status === 'SoldOther' ? 'Sold to Others' : 'Available',
    'Preassigned Points': p.preassignedPoints,
    'Final Price': p.status === 'BoughtUs' ? p.actualPrice : '-',
    'Role': p.role || '-',
    'Priority': p.priority || '-',
    'Notes': p.notes || '-',
    'Handled At': p.handledAt ? new Date(p.handledAt).toLocaleString() : '-'
  }));
  
  const playerWs = XLSX.utils.json_to_sheet(playerRows);
  XLSX.utils.book_append_sheet(wb, playerWs, 'Auction Results');

  // Sheet 2: Summary
  const summaryData = [
    ['Auction Summary', ''],
    ['Team Name', teamName],
    ['Total Budget', budget],
    ['Points Spent', spent],
    ['Remaining Points', budget - spent],
    ['Total Players Bought', players.filter(p => p.status === 'BoughtUs').length],
    ['Exported On', new Date().toLocaleString()]
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  XLSX.writeFile(wb, `${teamName}_Auction_Tracker_Export.xlsx`);
};
