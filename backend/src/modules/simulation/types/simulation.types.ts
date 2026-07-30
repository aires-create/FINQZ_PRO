export type SimulationCompatibilityMode =
  | 'CANONICAL'
  | 'COMPATIBILITY'
  | 'LEGACY'
  | 'TRANSIENT';

export type SimulationPartyRole =
  | 'customer'
  | 'co_borrower'
  | 'guarantor'
  | 'holder'
  | 'beneficiary'
  | 'seller'
  | string;

export type SimulationAssetKind =
  | 'vehicle'
  | 'property'
  | 'income'
  | 'other'
  | string;

export type SimulationCollateralKind =
  | 'vehicle'
  | 'property'
  | 'pledge'
  | 'assignment'
  | 'guarantor'
  | 'other'
  | string;

export type SimulationDecisionStatus =
  | 'APPROVED'
  | 'REJECTED'
  | 'PENDING'
  | 'NEEDS_REVIEW';

export type SimulationProposalStatus =
  | 'DRAFT'
  | 'READY'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type SimulationResultStatus =
  | 'DRAFT'
  | 'CALCULATED'
  | 'REVIEWED'
  | 'ACCEPTED'
  | 'REJECTED';
