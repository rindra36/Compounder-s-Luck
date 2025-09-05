
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SimulationForm } from "@/components/simulation-form";
import { SimulationLog } from "@/components/simulation-log";
import { ProfitProjectionTable } from "@/components/profit-projection";
import { runSimulation } from "@/lib/simulation";
import type { LogEntry, SimulationParams, SimulationStatus } from "@/lib/types";
import { Leaf } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SIMULATION_SPEED_MS = 150;

const formSchema = z.object({
  initialBalance: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .gte(0, { message: "Cannot be negative." }),
  initialInvestment: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .positive({ message: "Must be a positive number." }),
  payoutPercentage: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .min(1, { message: "Must be at least 1." })
    .max(200, { message: "Cannot exceed 200." }),
  numberOfStages: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int({ message: "Must be a whole number." })
    .min(1, { message: "Must be at least 1." }),
  winRate: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .min(0, { message: "Cannot be negative." })
    .max(100, { message: "Cannot exceed 100." }),
});

export default function SimulatorPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<SimulationStatus>("idle");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialBalance: 1000,
      initialInvestment: 10,
      payoutPercentage: 85,
      numberOfStages: 5,
      winRate: 60,
    },
    mode: "onChange", // to update projection table dynamically
  });

  const formValues = form.watch();

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
    <>
      <div className="flex flex-col items-center text-center mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="h-10 w-10 text-primary-foreground" />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary-foreground to-secondary-foreground text-transparent bg-clip-text">
            Strategy Simulator
          </h1>
        </div>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Simulate the "Progressive Compound" trading strategy. Define your parameters, press start, and see if luck is on your side.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <SimulationForm form={form} onStart={handleStartSimulation} isRunning={isRunning} />
        </div>
        <div className="md:col-span-2">
          <Tabs defaultValue="log">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="log">Simulation Log</TabsTrigger>
              <TabsTrigger value="projection">Profit Projection</TabsTrigger>
            </TabsList>
            <TabsContent value="log">
               <SimulationLog logs={logs} status={status} />
            </TabsContent>
            <TabsContent value="projection">
              <ProfitProjectionTable 
                initialBalance={formValues.initialBalance}
                initialInvestment={formValues.initialInvestment} 
                payoutPercentage={formValues.payoutPercentage}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
