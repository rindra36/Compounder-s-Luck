
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress";
import { saveSession, Session, SessionRules, SessionStats, Trade } from "@/lib/journal";
import { Trophy, ShieldAlert, Target, Repeat, StepForward, ThumbsUp, ThumbsDown } from "lucide-react";

const rulesSchema = z.object({
  profitTarget: z.coerce.number().int().min(1, "Must be at least 1"),
  lossLimit: z.coerce.number().int().min(1, "Must be at least 1"),
  maxTrades: z.coerce.number().int().min(1, "Must be at least 1"),
});

export default function ManualTradingJournal() {
  const [sessionActive, setSessionActive] = useState(false);
  const [rules, setRules] = useState<SessionRules>({ profitTarget: 0, lossLimit: 0, maxTrades: 0 });
  const [stats, setStats] = useState<SessionStats>({ stagesCompleted: 0, significantLosses: 0, totalTrades: 0 });
  const [tradeLog, setTradeLog] = useState<Trade[]>([]);
  const [sessionResult, setSessionResult] = useState<Session['result'] | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = ready for step 1, 1 = ready for step 2

  const form = useForm<SessionRules>({
    resolver: zodResolver(rulesSchema),
    defaultValues: {
      profitTarget: 1,
      lossLimit: 2,
      maxTrades: 8,
    },
  });

  useEffect(() => {
    if (!sessionActive) return;

    let result: Session['result'] | null = null;
    if (stats.stagesCompleted >= rules.profitTarget) {
      result = 'Profit Target Hit';
    } else if (stats.significantLosses >= rules.lossLimit) {
      result = 'Loss Limit Reached';
    } else if (stats.totalTrades >= rules.maxTrades) {
      result = 'Max Trades Reached';
    }

    if (result) {
      setSessionResult(result);
      const sessionData: Session = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        rules,
        result,
        stats,
        tradeLog,
      };
      saveSession(sessionData);
      setSessionActive(false);
    }
  }, [stats, rules, sessionActive, tradeLog]);

  const handleStartSession = (data: SessionRules) => {
    setRules(data);
    setStats({ stagesCompleted: 0, significantLosses: 0, totalTrades: 0 });
    setTradeLog([]);
    setCurrentStep(0);
    setSessionActive(true);
    setSessionResult(null);
  };

  const handleTrade = (trade: Trade) => {
    if (!sessionActive) return;

    setTradeLog(prev => [...prev, trade]);
    setStats(prev => ({ ...prev, totalTrades: prev.totalTrades + 1 }));

    if (trade === 'W') {
      if (currentStep === 0) {
        // Completed Step 1
        setCurrentStep(1);
      } else {
        // Completed Step 2 -> Stage Complete
        setStats(prev => ({ ...prev, stagesCompleted: prev.stagesCompleted + 1 }));
        setCurrentStep(0);
      }
    } else if (trade === 'L1') {
      // Significant Loss
      setStats(prev => ({ ...prev, significantLosses: prev.significantLosses + 1 }));
      setCurrentStep(0); // Reset progress within the stage
    } else if (trade === 'L2') {
      // Minor Loss, reset step
      setCurrentStep(0);
    }
  };

  const resetSession = () => {
    setSessionActive(false);
    setSessionResult(null);
    setCurrentStep(0);
    form.reset();
  };

  const stepButtonText = currentStep === 0 ? "WIN (Step 1)" : "WIN (Step 2)";

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Manual Trading Journal</h1>
        <p className="max-w-2xl text-lg text-muted-foreground mt-2">Track your live trading sessions based on the Progressive Compound strategy.</p>
      </div>

      {!sessionActive && !sessionResult && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Session Rules</CardTitle>
            <CardDescription>Define your goals and limits before you start.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleStartSession)} className="space-y-6">
               <div className="space-y-4">
                <Controller
                  name="profitTarget"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label className="text-sm font-medium">Profit Target (Stages)</label>
                      <Input type="number" {...field} />
                      {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="lossLimit"
                  control={form.control}
                  render={({ field, fieldState }) => (
                     <div>
                      <label className="text-sm font-medium">Loss Limit (Significant Losses)</label>
                      <Input type="number" {...field} />
                      {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="maxTrades"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <label className="text-sm font-medium">Max Trades Limit</label>
                      <Input type="number" {...field} />
                      {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <StepForward className="mr-2 h-4 w-4" />
                Start Session
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(sessionActive || sessionResult) && (
        <div className="w-full max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Session Dashboard</CardTitle>
              <CardDescription>Current Step: {currentStep + 1}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Stages Completed</span>
                  <span className="text-sm font-bold">{stats.stagesCompleted} / {rules.profitTarget}</span>
                </div>
                <Progress value={(stats.stagesCompleted / rules.profitTarget) * 100} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Significant Losses</span>
                  <span className="text-sm font-bold">{stats.significantLosses} / {rules.lossLimit}</span>
                </div>
                <Progress value={(stats.significantLosses / rules.lossLimit) * 100} className="[&>*]:bg-destructive" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-muted-foreground">Total Trades</span>
                  <span className="text-sm font-bold">{stats.totalTrades} / {rules.maxTrades}</span>
                </div>
                <Progress value={(stats.totalTrades / rules.maxTrades) * 100} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trade Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => handleTrade('W')} disabled={!sessionActive} className="h-16 text-lg bg-green-600 hover:bg-green-700">
                <ThumbsUp className="mr-2" /> {stepButtonText}
              </Button>
              <Button onClick={() => handleTrade('L1')} disabled={!sessionActive || currentStep === 1} className="h-16 text-lg bg-red-700 hover:red-800 disabled:opacity-50">
                <ShieldAlert className="mr-2" /> LOSS (Step 1)
              </Button>
              <Button onClick={() => handleTrade('L2')} disabled={!sessionActive || currentStep === 0} className="h-16 text-lg bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50">
                <ThumbsDown className="mr-2" /> LOSS (Step 2)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!sessionResult} onOpenChange={() => !sessionResult && setSessionResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {sessionResult === 'Profit Target Hit' && <Trophy className="text-green-400" />}
              {sessionResult === 'Loss Limit Reached' && <ShieldAlert className="text-red-400" />}
              {sessionResult === 'Max Trades Reached' && <Target className="text-yellow-400" />}
              Session Over: {sessionResult}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your trading session has concluded. You can view the full details in the History page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={resetSession} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Repeat className="mr-2 h-4 w-4" />
              Start New Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
