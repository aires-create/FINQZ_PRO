export type RefinancingEngineInput = {
  outstandingBalanceAmount: number;
  newApprovedAmount: number;
  newInstallmentAmount: number;
  currentInstallmentAmount?: number;
  settlementCostAmount?: number;
};

export type RefinancingEngineResult = {
  outstandingBalanceAmount: number;
  newApprovedAmount: number;
  settlementCostAmount: number;
  netChangeAmount: number;
  cashOutAmount: number;
  newInstallmentAmount: number;
  currentInstallmentAmount: number;
  installmentDeltaAmount: number;
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

export class RefinancingEngineService {
  calculate(input: RefinancingEngineInput): RefinancingEngineResult {
    const outstandingBalanceAmount = normalizeAmount(
      input.outstandingBalanceAmount,
    );
    const newApprovedAmount = normalizeAmount(input.newApprovedAmount);
    const settlementCostAmount = normalizeAmount(input.settlementCostAmount);
    const newInstallmentAmount = normalizeAmount(input.newInstallmentAmount);
    const currentInstallmentAmount = normalizeAmount(
      input.currentInstallmentAmount,
    );

    const netChangeAmount =
      newApprovedAmount - outstandingBalanceAmount - settlementCostAmount;
    const cashOutAmount = netChangeAmount > 0 ? netChangeAmount : 0;
    const installmentDeltaAmount =
      newInstallmentAmount - currentInstallmentAmount;

    return {
      outstandingBalanceAmount: roundCurrency(outstandingBalanceAmount),
      newApprovedAmount: roundCurrency(newApprovedAmount),
      settlementCostAmount: roundCurrency(settlementCostAmount),
      netChangeAmount: roundCurrency(netChangeAmount),
      cashOutAmount: roundCurrency(cashOutAmount),
      newInstallmentAmount: roundCurrency(newInstallmentAmount),
      currentInstallmentAmount: roundCurrency(currentInstallmentAmount),
      installmentDeltaAmount: roundCurrency(installmentDeltaAmount),
      hasCashOut: cashOutAmount > 0,
    };
  }
}
