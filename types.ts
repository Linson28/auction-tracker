
export type PlayerStatus = 'Available' | 'SoldOther' | 'BoughtUs';

export interface Player {
  id: string;
  playerNo?: string;
  name: string;
  parishName?: string;
  preassignedPoints: number;
  actualPrice?: number;
  status: PlayerStatus;
  role?: string;
  priority?: string;
  reasons?: string;
  notes?: string;
  handledAt?: number; // timestamp
}

export interface AuctionState {
  teamName: string;
  totalBudget: number;
  players: Player[];
  isStarted: boolean;
}

export interface ImportIssue {
  row: number;
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ImportPreviewData {
  players: Player[];
  issues: ImportIssue[];
}
