"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getHistory, clearHistory, Session } from "@/lib/journal";
import { Trash2, Calendar, Target, ShieldAlert, Trophy, Sigma } from "lucide-react";

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

const SessionCard = ({ session }: { session: Session }) => (
  <Card className="bg-card/70">
    <CardHeader>
      <div className="flex justify-between items-start">
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
        <div className="text-right text-sm text-muted-foreground">
          ID: {session.id}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
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

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center w-full">
        <div className="flex justify-between items-center">
            <div className="text-left">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Trading History</h1>
                 <p className="max-w-2xl text-lg text-muted-foreground mt-2">Review your past manual trading sessions.</p>
            </div>
          {history.length > 0 && (
            <Button variant="destructive" onClick={handleClearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear History
            </Button>
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
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
