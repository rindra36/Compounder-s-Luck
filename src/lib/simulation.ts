import type { SimulationParams, LogEntry } from './types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function* runSimulation(params: SimulationParams): Generator<LogEntry, void, unknown> {
  // initialBalance is not used in the live simulation, only projection.
  const { initialInvestment, payoutPercentage, numberOfStages, winRate } = params;
  const payoutMultiplier = payoutPercentage / 100;

  let currentStage = 1;
  const stageStartInvestments: number[] = [initialInvestment];

  yield {
    type: 'INFO',
    message: `--- Starting Simulation ---`,
  };
  yield {
    type: 'INFO',
    message: `Initial Investment: ${formatCurrency(initialInvestment)}, Payout: ${payoutPercentage}%, Win Rate: ${winRate}%, Target: ${numberOfStages} Stages`,
  };

  while (currentStage <= numberOfStages) {
    let currentInvestment = stageStartInvestments[currentStage - 1];

    // --- Step 1 ---
    yield {
      type: 'STEP',
      stage: currentStage,
      step: 1,
      message: `Investing: ${formatCurrency(currentInvestment)}`,
    };

    const step1Win = Math.random() * 100 < winRate;

    if (step1Win) {
      const profit1 = currentInvestment * payoutMultiplier;
      yield {
        type: 'STEP',
        stage: currentStage,
        step: 1,
        message: `WIN! Profit: ${formatCurrency(profit1)}. Advancing to Step 2.`,
      };

      // --- Step 2 ---
      const investment2 = profit1;
      yield {
        type: 'STEP',
        stage: currentStage,
        step: 2,
        message: `Investing: ${formatCurrency(investment2)}`,
      };

      const step2Win = Math.random() * 100 < winRate;

      if (step2Win) {
        const profit2 = investment2 * payoutMultiplier;
        const totalStageProfit = profit1 + profit2;
        stageStartInvestments[currentStage] = totalStageProfit;
        
        yield {
          type: 'STAGE_COMPLETE',
          stage: currentStage,
          message: `WIN! Profit: ${formatCurrency(profit2)}. Stage ${currentStage} COMPLETE! Total stage profit: ${formatCurrency(totalStageProfit)}.`,
        };
        currentStage++;
      } else { // Lost Step 2
        yield {
          type: 'REATTEMPT',
          stage: currentStage,
          step: 2,
          message: `LOSS. Lost: ${formatCurrency(investment2)}. Re-attempting Stage ${currentStage}.`,
        };
        // No change to currentStage or stageStartInvestments, loop will restart this stage.
      }
    } else { // Lost Step 1
      yield {
        type: 'STEP',
        stage: currentStage,
        step: 1,
        message: `LOSS. Lost: ${formatCurrency(currentInvestment)}.`,
      };
      
      if (currentStage === 1) {
        yield {
          type: 'FAILURE',
          message: 'STRATEGY FAILED. Initial investment lost at Stage 1.',
        };
        return; // End simulation
      } else {
        currentStage--;
        yield {
          type: 'REVERT',
          stage: currentStage + 1,
          message: `Reverting to Stage ${currentStage}.`,
        };
      }
    }
  }

  if (currentStage > numberOfStages) {
    const totalProfit = stageStartInvestments.reduce((acc, val, index) => index > 0 ? acc + val : acc, 0) - initialInvestment;
    yield {
      type: 'SUCCESS',
      message: `CONGRATULATIONS! All ${numberOfStages} stages completed. Total profit: ${formatCurrency(totalProfit)}`,
    };
  }
}
