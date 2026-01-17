
import { AuctionState } from './types';

export const INITIAL_STATE: AuctionState = {
  teamName: '',
  totalBudget: 0,
  players: [],
  isStarted: false,
};

export const ROLE_OPTIONS = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
export const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

export const COLUMN_MAPPINGS = {
  playerNo: ['player no', 'no', 'sr no', 'id', 'p_no'],
  name: ['player name', 'name', 'player', 'p_name'],
  parishName: ['parish name', 'parish', 'team', 'club'],
  preassignedPoints: ['points', 'planned points', 'base price', 'preassigned points', 'value'],
  role: ['role', 'position', 'type'],
  priority: ['priority', 'tier'],
  reasons: ['reasons', 'reason', 'remarks'],
  notes: ['notes', 'comments', 'info']
};
