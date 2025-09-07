
export type Trade = 'W' | 'L1' | 'L2';

export interface SessionRules {
  profitTarget: number;
  lossLimit: number;
  maxTrades: number;
  enforceMaxTrades: boolean;
}

export interface SessionStats {
  stagesCompleted: number;
  significantLosses: number;
  totalTrades: number;
}

// Represents a completed session for the history
export interface Session {
  id: string;
  date: string;
  rules: SessionRules;
  result: 'Profit Target Hit' | 'Loss Limit Reached' | 'Max Trades Reached';
  stats: SessionStats;
  tradeLog: Trade[];
}

// Represents an in-progress session
export interface ActiveSession {
  rules: SessionRules;
  stats: SessionStats;
  tradeLog: Trade[];
  currentStep: number;
}


const HISTORY_KEY = 'tradingHistory';
const ACTIVE_SESSION_KEY = 'activeTradingSession';

// --- History Functions ---

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

export function deleteSessions(idsToDelete: string[]): Session[] {
    if (typeof window === 'undefined') return [];
    try {
        let history = getHistory();
        const idsSet = new Set(idsToDelete);
        history = history.filter(session => !idsSet.has(session.id));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        return history;
    } catch (error) {
        console.error("Failed to delete sessions from localStorage", error);
        return getHistory(); // return existing history on failure
    }
}


// --- Active Session Functions ---

export function getActiveSession(): ActiveSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const sessionJson = localStorage.getItem(ACTIVE_SESSION_KEY);
      const session = sessionJson ? JSON.parse(sessionJson) : null;
      // Migration for older sessions without enforceMaxTrades
      if (session && typeof session.rules.enforceMaxTrades === 'undefined') {
        session.rules.enforceMaxTrades = true;
      }
      return session;
    } catch (error) {
      console.error("Failed to parse active session from localStorage", error);
      return null;
    }
}

export function saveActiveSession(session: ActiveSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Failed to save active session to localStorage", error);
    }
}

export function clearActiveSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACTIVE_SESSION_KEY);
}
