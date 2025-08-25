export interface SimulationParams {
  initialInvestment: number;
  payoutPercentage: number;
  numberOfStages: number;
  winRate: number;
}

export type LogEntryType =
  | 'INFO'
  | 'STEP'
  | 'STAGE_COMPLETE'
  | 'REATTEMPT'
  | 'REVERT'
  | 'SUCCESS'
  | 'FAILURE';

export interface LogEntry {
  type: LogEntryType;
  stage?: number;
  step?: number;
  message: string;
}

export type SimulationStatus = 'idle' | 'running' | 'success' | 'failure';
