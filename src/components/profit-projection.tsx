
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProfitProjectionTableProps = {
  initialBalance: number;
  initialInvestment: number;
  payoutPercentage: number;
};

const MAX_STAGES_TO_PROJECT = 10;

function formatCurrency(amount: number): string {
    if (isNaN(amount)) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

export function ProfitProjectionTable({
  initialBalance,
  initialInvestment,
  payoutPercentage,
}: ProfitProjectionTableProps) {
  const payoutMultiplier = payoutPercentage / 100;
  
  const projections = Array.from({ length: MAX_STAGES_TO_PROJECT }).reduce((acc, _, i) => {
    const stage = i + 1;
    
    // Determine the starting investment for the current stage
    const previousStage = acc[i-1];
    const step1Investment = previousStage ? previousStage.totalStageProfit : initialInvestment;

    if (step1Investment <= 0) {
        // Stop projection if investment becomes zero or negative
        return acc;
    }

    const step1Profit = step1Investment * payoutMultiplier;
    const step2Investment = step1Profit;
    const step2Profit = step2Investment * payoutMultiplier;
    const totalStageProfit = step1Profit + step2Profit;
    
    // Calculate cumulative balance
    const previousBalance = previousStage ? previousStage.cumulativeBalance : initialBalance;
    const cumulativeBalance = previousBalance + totalStageProfit;

    acc.push({
      stage,
      step1Investment,
      step1Profit,
      step2Investment,
      step2Profit,
      totalStageProfit,
      cumulativeBalance,
    });
    
    return acc;
  }, [] as Array<{
      stage: number;
      step1Investment: number;
      step1Profit: number;
      step2Investment: number;
      step2Profit: number;
      totalStageProfit: number;
      cumulativeBalance: number;
  }>);


  const isValidInput = initialBalance >= 0 && initialInvestment > 0 && payoutPercentage > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Profit Projection</CardTitle>
        <CardDescription>
          Potential profits based on your parameters. This table assumes every
          trade is a win.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-[80px]">Stage</TableHead>
                <TableHead>Step 1 Profit</TableHead>
                <TableHead>Step 2 Profit</TableHead>
                <TableHead>Total Profit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isValidInput ? (
                projections.map((p) => (
                  <TableRow key={p.stage}>
                    <TableCell className="font-medium">{p.stage}</TableCell>
                    <TableCell>{formatCurrency(p.step1Profit)}</TableCell>
                    <TableCell>{formatCurrency(p.step2Profit)}</TableCell>
                    <TableCell>{formatCurrency(p.totalStageProfit)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(p.cumulativeBalance)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Enter a valid Initial Balance, positive Initial Investment and Payout Percentage to see projections.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
