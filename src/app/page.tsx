"use client";

import { useState } from "react";
import { SimulationForm } from "@/components/simulation-form";
import { SimulationLog } from "@/components/simulation-log";
import { runSimulation } from "@/lib/simulation";
import type { LogEntry, SimulationParams, SimulationStatus } from "@/lib/types";
import { Leaf } from "lucide-react";

const SIMULATION_SPEED_MS = 150;

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<SimulationStatus>("idle");

  const handleStartSimulation = async (params: SimulationParams) => {
    if (isRunning) return;

    setIsRunning(true);
    setStatus("running");
    setLogs([]);

    const simulationGenerator = runSimulation(params);

    const processNextStep = () => {
      const next = simulationGenerator.next();

      if (!next.done) {
        const logEntry = next.value;
        setLogs((prevLogs) => [...prevLogs, logEntry]);
        if (logEntry.type === 'FAILURE' || logEntry.type === 'SUCCESS') {
          setStatus(logEntry.type.toLowerCase() as SimulationStatus);
          setIsRunning(false);
        } else {
          setTimeout(processNextStep, SIMULATION_SPEED_MS);
        }
      } else {
        setIsRunning(false);
      }
    };
    
    processNextStep();
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="h-10 w-10 text-primary-foreground" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary-foreground to-secondary-foreground text-transparent bg-clip-text">
            Compounder's Luck
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Simulate the "Progressive Compound" trading strategy. Define your parameters, press start, and see if luck is on your side.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <SimulationForm onStart={handleStartSimulation} isRunning={isRunning} />
        </div>
        <div className="md:col-span-2">
          <SimulationLog logs={logs} status={status} />
        </div>
      </div>
    </main>
  );
}
