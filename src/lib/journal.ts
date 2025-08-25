export type Trade = 'W' | 'L1' | 'L2';

export interface SessionRules {
  profitTarget: number;
  lossLimit: number;
  maxTrades: number;
}

export interface SessionStats {
  stagesCompleted: number;
  significantLosses: number;
  totalTrades: number;
}

export interface Session {
  id: string;
  date: string;
  rules: SessionRules;
  result: 'Profit Target Hit' | 'Loss Limit Reached' | 'Max Trades Reached';
  stats: SessionStats;
  tradeLog: Trade[];
}

const HISTORY_KEY = 'tradingHistory';

export function getHistory(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const historyJson = localStorage.getItem(HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error("Failed to parse trading history from localStorage", error);
    return [];
  }
}

export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getHistory();
    history.unshift(session); // Add new session to the beginning
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save session to localStorage", error);
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}
