export type PortabilityEngineInput = {
  currentOutstandingBalanceAmount: number;
  currentInstallmentAmount: number;
  currentTotalRemainingAmount: number;
  targetApprovedAmount: number;
  targetInstallmentAmount: number;
  targetTotalAmount: number;
  migrationCostAmount?: number;
};

export type PortabilityEngineResult = {
  currentOutstandingBalanceAmount: number;
  currentInstallmentAmount: number;
  currentTotalRemainingAmount: number;
  targetApprovedAmount: number;
  targetInstallmentAmount: number;
  targetTotalAmount: number;
  migrationCostAmount: number;
  installmentReductionAmount: number;
  installmentReductionPercentage: number;
  totalSavingsAmount: number;
  netSavingsAmount: number;
  cashOutAmount: number;
  hasInstallmentReduction: boolean;
  hasSavings: boolean;
  hasCashOut: boolean;
};

const normalizeAmount = (value: number | undefined) => {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
};

const roundCurrency = (value: number) => {
  return Number(value.toFixed(2));
};

const roundPercentage = (value: number) => {
  return Number(value.toFixed(8));
};

export class PortabilityEngineService {
  calculate(input: PortabilityEngineInput): PortabilityEngineResult {
    const currentOutstandingBalanceAmount = normalizeAmount(
      input.currentOutstandingBalanceAmount,
    );
    const currentInstallmentAmount = normalizeAmount(
      input.currentInstallmentAmount,
    );
    const currentTotalRemainingAmount = normalizeAmount(
      input.currentTotalRemainingAmount,
    );
    const targetApprovedAmount = normalizeAmount(input.targetApprovedAmount);
    const targetInstallmentAmount = normalizeAmount(
      input.targetInstallmentAmount,
    );
    const targetTotalAmount = normalizeAmount(input.targetTotalAmount);
    const migrationCostAmount = normalizeAmount(input.migrationCostAmount);

    const installmentReductionAmount = Math.max(
      currentInstallmentAmount - targetInstallmentAmount,
      0,
    );
    const installmentReductionPercentage =
      currentInstallmentAmount > 0
        ? installmentReductionAmount / currentInstallmentAmount
        : 0;
    const totalSavingsAmount = Math.max(
      currentTotalRemainingAmount - targetTotalAmount,
      0,
    );
    const netSavingsAmount = Math.max(
      totalSavingsAmount - migrationCostAmount,
      0,
    );
    const cashOutAmount = Math.max(
      targetApprovedAmount -
        currentOutstandingBalanceAmount -
        migrationCostAmount,
      0,
    );

    return {
      currentOutstandingBalanceAmount: roundCurrency(
        currentOutstandingBalanceAmount,
      ),
      currentInstallmentAmount: roundCurrency(currentInstallmentAmount),
      currentTotalRemainingAmount: roundCurrency(currentTotalRemainingAmount),
      targetApprovedAmount: roundCurrency(targetApprovedAmount),
      targetInstallmentAmount: roundCurrency(targetInstallmentAmount),
      targetTotalAmount: roundCurrency(targetTotalAmount),
      migrationCostAmount: roundCurrency(migrationCostAmount),
      installmentReductionAmount: roundCurrency(installmentReductionAmount),
      installmentReductionPercentage: roundPercentage(
        installmentReductionPercentage,
      ),
      totalSavingsAmount: roundCurrency(totalSavingsAmount),
      netSavingsAmount: roundCurrency(netSavingsAmount),
      cashOutAmount: roundCurrency(cashOutAmount),
      hasInstallmentReduction: installmentReductionAmount > 0,
      hasSavings: netSavingsAmount > 0,
      hasCashOut: cashOutAmount > 0,
    };
  }
}
