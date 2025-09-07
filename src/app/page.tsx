
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress";
import { saveSession, Session, SessionRules, SessionStats, Trade, getActiveSession, saveActiveSession, clearActiveSession, ActiveSession } from "@/lib/journal";
import { Trophy, ShieldAlert, Target, Repeat, StepForward, ThumbsUp, ThumbsDown, Pencil, XCircle } from "lucide-react";

const rulesSchema = z.object({
  profitTarget: z.coerce.number().int().min(1, "Must be at least 1"),
  lossLimit: z.coerce.number().int().min(1, "Must be at least 1"),
  enforceMaxTrades: z.boolean(),
  maxTrades: z.coerce.number().int(),
}).refine(data => {
    if (data.enforceMaxTrades) {
        return data.maxTrades >= 1;
    }
    return true;
}, {
    message: "Must be at least 1",
    path: ["maxTrades"],
});


export default function ManualTradingJournal() {
  const [sessionActive, setSessionActive] = useState(false);
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [rules, setRules] = useState<SessionRules>({ profitTarget: 0, lossLimit: 0, maxTrades: 0, enforceMaxTrades: true });
  const [stats, setStats] = useState<SessionStats>({ stagesCompleted: 0, significantLosses: 0, totalTrades: 0 });
  const [tradeLog, setTradeLog] = useState<Trade[]>([]);
  const [sessionResult, setSessionResult] = useState<Session['result'] | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = ready for step 1, 1 = ready for step 2

  const form = useForm<SessionRules>({
    resolver: zodResolver(rulesSchema),
    defaultValues: {
      profitTarget: 1,
      lossLimit: 2,
      enforceMaxTrades: true,
      maxTrades: 8,
    },
  });

  const watchEnforceMaxTrades = form.watch("enforceMaxTrades");

  // Load active session on component mount
  useEffect(() => {
    const activeSession = getActiveSession();
    if (activeSession) {
      setRules(activeSession.rules);
      setStats(activeSession.stats);
      setTradeLog(activeSession.tradeLog);
      setCurrentStep(activeSession.currentStep);
      setSessionActive(true);
      form.reset(activeSession.rules); // Pre-fill form for editing
    }
  }, [form]);

  // Check for session completion
  useEffect(() => {
    if (!sessionActive) return;

    let result: Session['result'] | null = null;
    if (stats.stagesCompleted >= rules.profitTarget) {
      result = 'Profit Target Hit';
    } else if (stats.significantLosses >= rules.lossLimit) {
      result = 'Loss Limit Reached';
    } else if (rules.enforceMaxTrades && stats.totalTrades >= rules.maxTrades) {
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
      clearActiveSession();
      setSessionActive(false);
    } else {
      // Save progress if session is still active
      const activeSessionData: ActiveSession = { rules, stats, tradeLog, currentStep };
      saveActiveSession(activeSessionData);
    }
  }, [stats, rules, tradeLog, currentStep, sessionActive]);


  const handleStartSession = (data: SessionRules) => {
    if (!sessionActive) { // Starting a brand new session
      const initialStats = { stagesCompleted: 0, significantLosses: 0, totalTrades: 0 };
      const initialTradeLog: Trade[] = [];
      const initialStep = 0;
      setStats(initialStats);
      setTradeLog(initialTradeLog);
      setCurrentStep(initialStep);
      saveActiveSession({ rules: data, stats: initialStats, tradeLog: initialTradeLog, currentStep: initialStep });
    } else { // Just updating rules for an existing session
       saveActiveSession({ rules: data, stats, tradeLog, currentStep });
    }

    setRules(data);
    setSessionActive(true);
    setSessionResult(null);
    setIsEditingRules(false);
  };

  const handleTrade = (trade: Trade) => {
    if (!sessionActive || isEditingRules) return;

    const newTradeLog = [...tradeLog, trade];
    let newStats = { ...stats, totalTrades: stats.totalTrades + 1 };
    let newCurrentStep = currentStep;

    if (trade === 'W') {
      if (currentStep === 0) {
        // Completed Step 1
        newCurrentStep = 1;
      } else {
        // Completed Step 2 -> Stage Complete
        newStats = { ...newStats, stagesCompleted: newStats.stagesCompleted + 1 };
        newCurrentStep = 0;
      }
    } else if (trade === 'L1') {
      // This is a Step 1 Loss
      if (stats.stagesCompleted > 0) {
        // Revert a stage instead of counting a significant loss
        newStats = { ...newStats, stagesCompleted: stats.stagesCompleted - 1 };
      } else {
        // No completed stages to fall back on, so it's a significant loss
        newStats = { ...newStats, significantLosses: newStats.significantLosses + 1 };
      }
      newCurrentStep = 0; // Reset progress within the stage
    } else if (trade === 'L2') {
      // Minor Loss, reset step
      newCurrentStep = 0;
    }
    
    setTradeLog(newTradeLog);
    setStats(newStats);
    setCurrentStep(newCurrentStep);
  };

  const resetSession = () => {
    setSessionActive(false);
    setSessionResult(null);
    setCurrentStep(0);
    setStats({ stagesCompleted: 0, significantLosses: 0, totalTrades: 0 });
    setTradeLog([]);
    clearActiveSession();
    form.reset({
      profitTarget: 1,
      lossLimit: 2,
      enforceMaxTrades: true,
      maxTrades: 8,
    });
    setShowCancelConfirm(false);
    setIsEditingRules(false);
  };

  const stepButtonText = currentStep === 0 ? "WIN (Step 1)" : "WIN (Step 2)";

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Manual Trading Journal</h1>
        <p className="max-w-2xl text-lg text-muted-foreground mt-2">Track your live trading sessions based on the Progressive Compound strategy.</p>
      </div>

      {(!sessionActive || isEditingRules) && !sessionResult && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isEditingRules ? "Edit Session Rules" : "Set Session Rules"}</CardTitle>
            <CardDescription>{isEditingRules ? "Adjust your goals and continue your session." : "Define your goals and limits before you start."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleStartSession)} className="space-y-6">
               <div className="space-y-4">
                <Controller
                  name="profitTarget"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Label htmlFor="profitTarget" className="text-sm font-medium">Profit Target (Stages)</Label>
                      <Input id="profitTarget" type="number" {...field} />
                      {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="lossLimit"
                  control={form.control}
                  render={({ field, fieldState }) => (
                     <div>
                      <Label htmlFor="lossLimit" className="text-sm font-medium">Loss Limit (Significant Losses)</Label>
                      <Input id="lossLimit" type="number" {...field} />
                      {fieldState.error && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                 <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Controller
                            name="enforceMaxTrades"
                            control={form.control}
                            render={({ field }) => (
                                <Switch
                                    id="enforceMaxTrades"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                        <Label htmlFor="enforceMaxTrades">Enforce Max Trades Limit</Label>
                    </div>
                    <Controller
                    name="maxTrades"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <div>
                        <Input
                            id="maxTrades"
                            type="number"
                            {...field}
                            disabled={!watchEnforceMaxTrades}
                        />
                        {fieldState.error && watchEnforceMaxTrades && <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>}
                        </div>
                    )}
                    />
                </div>
              </div>
              <div className="flex gap-4">
                {isEditingRules && (
                    <Button type="button" variant="outline" onClick={() => setIsEditingRules(false)} className="w-full">
                        Cancel
                    </Button>
                )}
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <StepForward className="mr-2 h-4 w-4" />
                    {isEditingRules ? "Update Session" : "Start Session"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(sessionActive && !isEditingRules && !sessionResult) && (
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
                  <span className="text-sm font-bold">
                    {stats.totalTrades} {rules.enforceMaxTrades ? `/ ${rules.maxTrades}`: ''}
                  </span>
                </div>
                 {rules.enforceMaxTrades && (
                    <Progress value={(stats.totalTrades / rules.maxTrades) * 100} />
                )}
              </div>
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditingRules(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Rules
                </Button>
                <Button variant="destructive" onClick={() => setShowCancelConfirm(true)}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel Session
                </Button>
            </CardFooter>
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

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently discard the current session and all of its progress. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Session</AlertDialogCancel>
            <AlertDialogAction onClick={resetSession} variant="destructive">
              Cancel Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
