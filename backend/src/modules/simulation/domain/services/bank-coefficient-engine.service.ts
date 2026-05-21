import type { BankCoefficientRecord } from '../contracts/bank-coefficient.contract.js';

export type FindCoefficientInput = {
  bankCode?: string;
  productType?: string;
  operationType?: string;
  term?: number;
  referenceDate?: Date;
};

export type CompareCoefficientInput = {
  records: BankCoefficientRecord[];
};

const isBeforeOrEqual = (date: Date, referenceDate: Date) => {
  return date.getTime() <= referenceDate.getTime();
};

const isAfterOrEqual = (date: Date, referenceDate: Date) => {
  return date.getTime() >= referenceDate.getTime();
};

const isWithinWindow = (
  startsAt: Date | undefined,
  endsAt: Date | undefined,
  referenceDate: Date,
) => {
  const hasStarted = startsAt ? isBeforeOrEqual(startsAt, referenceDate) : true;
  const hasNotEnded = endsAt ? isAfterOrEqual(endsAt, referenceDate) : true;

  return hasStarted && hasNotEnded;
};

const isRecordValidAt = (
  record: BankCoefficientRecord,
  referenceDate: Date,
) => {
  if (!record.isActive) {
    return false;
  }

  return (
    isWithinWindow(record.effectiveAt, record.expiresAt, referenceDate) &&
    isWithinWindow(
      record.campaign?.startsAt,
      record.campaign?.endsAt,
      referenceDate,
    )
  );
};

const matchesInput = (
  record: BankCoefficientRecord,
  input: FindCoefficientInput,
) => {
  if (input.bankCode && record.bankCode !== input.bankCode) {
    return false;
  }

  if (input.productType && record.productType !== input.productType) {
    return false;
  }

  if (input.operationType && record.operationType !== input.operationType) {
    return false;
  }

  if (input.term !== undefined && record.term !== input.term) {
    return false;
  }

  return true;
};

const sortByCoefficient = (
  records: BankCoefficientRecord[],
): BankCoefficientRecord[] => {
  return [...records].sort((left, right) => left.coefficient - right.coefficient);
};

export class BankCoefficientEngineService {
  findBestCoefficient(
    records: BankCoefficientRecord[],
    input: FindCoefficientInput,
  ): BankCoefficientRecord | null {
    const referenceDate = input.referenceDate ?? new Date();
    const sortedRecords = sortByCoefficient(
      records.filter(
        (record) =>
          isRecordValidAt(record, referenceDate) &&
          matchesInput(record, input),
      ),
    );

    return sortedRecords[0] ?? null;
  }

  compareBanks(input: CompareCoefficientInput): BankCoefficientRecord[] {
    const referenceDate = new Date();

    return sortByCoefficient(
      input.records.filter((record) => isRecordValidAt(record, referenceDate)),
    );
  }
}
