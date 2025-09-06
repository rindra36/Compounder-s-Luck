
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getHistory, clearHistory, deleteSessions, Session } from "@/lib/journal";
import { Trash2, Calendar, Target, ShieldAlert, Trophy, Sigma, X } from "lucide-react";

type DialogState = {
  open: boolean;
  type: 'single' | 'bulk' | 'clear';
  idToDelete?: string;
};

const ResultIcon = ({ result }: { result: Session['result'] }) => {
  switch (result) {
    case 'Profit Target Hit':
      return <Trophy className="h-5 w-5 text-green-400" />;
    case 'Loss Limit Reached':
      return <ShieldAlert className="h-5 w-5 text-red-400" />;
    case 'Max Trades Reached':
      return <Target className="h-5 w-5 text-yellow-400" />;
    default:
      return null;
  }
};

const SessionCard = ({ session, isSelected, onSelectionChange, onDelete }: { session: Session; isSelected: boolean; onSelectionChange: (id: string, selected: boolean) => void; onDelete: (id: string) => void; }) => (
  <Card className={`bg-card/70 transition-colors ${isSelected ? 'border-accent' : ''}`}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
           <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(session.id, !!checked)}
            aria-label={`Select session ${session.id}`}
            className="mt-1"
          />
          <div>
            <CardTitle className="flex items-center gap-2">
              <ResultIcon result={session.result} />
              {session.result}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {new Date(session.date).toLocaleString()}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="text-right text-sm text-muted-foreground">
                ID: {session.id}
            </div>
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(session.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
             </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4 pl-12">
      <div>
        <h4 className="font-semibold mb-2">Session Rules</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <p><span className="font-medium">Profit Target:</span> {session.rules.profitTarget}</p>
          <p><span className="font-medium">Loss Limit:</span> {session.rules.lossLimit}</p>
          <p><span className="font-medium">Max Trades:</span> {session.rules.maxTrades}</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Final Stats</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <p><Trophy className="inline h-4 w-4 mr-1 text-green-400" />{session.stats.stagesCompleted}</p>
          <p><ShieldAlert className="inline h-4 w-4 mr-1 text-red-400" />{session.stats.significantLosses}</p>
          <p><Sigma className="inline h-4 w-4 mr-1" />{session.stats.totalTrades}</p>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Trade Log</h4>
        <div className="flex flex-wrap gap-1">
          {session.tradeLog.map((trade, index) => (
            <span
              key={index}
              className={`w-6 h-6 flex items-center justify-center rounded-sm text-xs font-bold
                ${trade === 'W' ? 'bg-green-500/80' : ''}
                ${trade === 'L1' ? 'bg-red-500/80' : ''}
                ${trade === 'L2' ? 'bg-yellow-500/80' : ''}
              `}
            >
              {trade[0]}
            </span>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function HistoryPage() {
  const [history, setHistory] = useState<Session[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogState, setDialogState] = useState<DialogState>({ open: false, type: 'clear' });

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(history.map(s => s.id)));
    }
  };

  const openConfirmationDialog = (type: DialogState['type'], idToDelete?: string) => {
    setDialogState({ open: true, type, idToDelete });
  };

  const handleConfirmDeletion = () => {
    let newHistory: Session[];
    if (dialogState.type === 'clear') {
      clearHistory();
      newHistory = [];
    } else if (dialogState.type === 'bulk') {
      newHistory = deleteSessions(Array.from(selectedIds));
    } else if (dialogState.type === 'single' && dialogState.idToDelete) {
      newHistory = deleteSessions([dialogState.idToDelete]);
    } else {
        return;
    }
    setHistory(newHistory);
    setSelectedIds(new Set());
    setDialogState({ open: false, type: 'clear' });
  };

  const allSelected = useMemo(() => history.length > 0 && selectedIds.size === history.length, [history, selectedIds]);
  const dialogDescription = useMemo(() => {
      switch(dialogState.type) {
          case 'single': return "This will permanently delete this session. This action cannot be undone.";
          case 'bulk': return `This will permanently delete the ${selectedIds.size} selected sessions. This action cannot be undone.`;
          case 'clear': return "This will permanently delete all trading history. This action cannot be undone.";
      }
  }, [dialogState.type, selectedIds.size]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
            <div className="text-left">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Trading History</h1>
                 <p className="max-w-2xl text-lg text-muted-foreground mt-2">Review your past manual trading sessions.</p>
            </div>
             {history.length > 0 && (
                <div className="flex items-center gap-2">
                     <Button 
                        variant="outline" 
                        onClick={handleSelectAll}
                        disabled={history.length === 0}
                    >
                        {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={() => openConfirmationDialog('bulk')}
                        disabled={selectedIds.size === 0}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedIds.size})
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={() => openConfirmationDialog('clear')}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Clear All History
                    </Button>
                </div>
            )}
        </div>
      </div>

      <div className="w-full max-w-4xl">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No saved trading sessions found.</p>
            <p className="text-sm">Complete a session in the Journal to see your history here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-4">
              {history.map(session => (
                <SessionCard 
                    key={session.id} 
                    session={session} 
                    isSelected={selectedIds.has(session.id)}
                    onSelectionChange={handleSelectionChange}
                    onDelete={(id) => openConfirmationDialog('single', id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

       <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletion} variant="destructive">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
