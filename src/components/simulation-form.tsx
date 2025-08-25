"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SimulationParams } from "@/lib/types";
import { Rocket } from "lucide-react";

const formSchema = z.object({
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

type SimulationFormProps = {
  onStart: (params: SimulationParams) => void;
  isRunning: boolean;
};

export function SimulationForm({ onStart, isRunning }: SimulationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialInvestment: 10,
      payoutPercentage: 85,
      numberOfStages: 5,
      winRate: 60,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onStart(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulation Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="initialInvestment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Investment ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payoutPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payout Percentage (%)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numberOfStages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Stages</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="winRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Simulated Win Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    The chance of winning a single trade.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isRunning} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Rocket className="mr-2 h-4 w-4" />
              {isRunning ? "Simulation in Progress..." : "Start Simulation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
