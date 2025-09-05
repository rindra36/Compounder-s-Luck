
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
  
  const projections = Array.from({ length: MAX_STAGES_TO_PROJECT }).map(
    (_, i) => {
      const stage = i + 1;
      let step1Investment = initialInvestment;

      // From stage 2 onwards, the investment is the total profit of the previous stage
      if (i > 0) {
        let prevStageInvestment = initialInvestment;
        for (let j = 0; j < i; j++) {
            const prevProfit1 = prevStageInvestment * payoutMultiplier;
            const prevProfit2 = prevProfit1 * payoutMultiplier;
            prevStageInvestment = prevProfit1 + prevProfit2;
        }
        step1Investment = prevStageInvestment;
      }
      
      const step1Profit = step1Investment * payoutMultiplier;
      const step2Investment = step1Profit;
      const step2Profit = step2Investment * payoutMultiplier;
      const totalStageProfit = step1Profit + step2Profit;
      
      // Recalculate cumulative balance up to the current stage
      let cumulativeBalance = initialBalance;
      let currentInvestmentForBalance = initialInvestment;
      for (let k = 0; k < stage; k++) {
        const profit1 = currentInvestmentForBalance * payoutMultiplier;
        const profit2 = profit1 * payoutMultiplier;
        const totalProfit = profit1 + profit2;
        
        cumulativeBalance += totalProfit;
        currentInvestmentForBalance = totalProfit;
      }

      return {
        stage,
        step1Investment,
        step1Profit,
        step2Investment,
        step2Profit,
        totalStageProfit,
        cumulativeBalance,
      };
    }
  );

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
