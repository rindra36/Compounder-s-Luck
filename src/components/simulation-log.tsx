"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LogEntry, LogEntryType, SimulationStatus } from "@/lib/types";
import {
  CheckCircle,
  XCircle,
  PartyPopper,
  RotateCcw,
  Undo2,
  Trophy,
  ShieldX,
  Info,
  TrendingUp,
  TrendingDown,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LogStyle = {
  icon: React.ElementType;
  color: string;
  title: string;
};

const logStyles: Record<LogEntryType, LogStyle> = {
  INFO: { icon: Info, color: "text-blue-400", title: "Simulation Info" },
  STEP: { icon: Loader, color: "", title: "Trade" }, // Handled dynamically
  STAGE_COMPLETE: { icon: PartyPopper, color: "text-accent", title: "Stage Complete" },
  REATTEMPT: { icon: RotateCcw, color: "text-yellow-500", title: "Re-attempting Stage" },
  REVERT: { icon: Undo2, color: "text-orange-500", title: "Reverting Stage" },
  SUCCESS: { icon: Trophy, color: "text-green-400", title: "Strategy Successful!" },
  FAILURE: { icon: ShieldX, color: "text-destructive", title: "Strategy Failed" },
};

const LogIcon = ({ entry }: { entry: LogEntry }) => {
  if (entry.type === 'STEP') {
    if (entry.message.includes('WIN')) {
      return <TrendingUp className="h-5 w-5 text-green-400" />;
    }
    if (entry.message.includes('LOSS')) {
      return <TrendingDown className="h-5 w-5 text-destructive" />;
    }
  }
  const Icon = logStyles[entry.type].icon;
  return <Icon className={cn("h-5 w-5", logStyles[entry.type].color)} />;
};

const LogCard = ({ entry }: { entry: LogEntry }) => {
  const { color, title } = logStyles[entry.type];
  let dynamicTitle = title;
  if(entry.stage) {
    dynamicTitle = `Stage ${entry.stage}${entry.step ? `, Step ${entry.step}`: ''}`;
  }


  return (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50">
      <div className="mt-1">
        <LogIcon entry={entry} />
      </div>
      <div className="flex-1">
        <p className={cn("font-semibold", entry.message.includes('WIN') ? 'text-green-400' : entry.message.includes('LOSS') ? 'text-destructive' : color)}>
          {dynamicTitle}
        </p>
        <p className="text-sm text-muted-foreground">{entry.message}</p>
      </div>
    </div>
  );
};

export function SimulationLog({ logs, status }: { logs: LogEntry[], status: SimulationStatus }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [logs]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Simulation Log</CardTitle>
        <CardDescription>Follow the play-by-play results of the simulation.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
           <div ref={scrollAreaRef} className="space-y-4">
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                <p>Your simulation log will appear here.</p>
                <p className="text-sm">Enter your parameters and start the simulation to begin.</p>
              </div>
            )}
            {logs.map((log, index) => (
              <LogCard key={index} entry={log} />
            ))}
           </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
