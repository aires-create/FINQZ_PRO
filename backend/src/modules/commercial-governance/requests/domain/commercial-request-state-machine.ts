import { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';

export const COMMERCIAL_REQUEST_ALLOWED_TRANSITIONS: Readonly<
  Record<CommercialRequestStatus, readonly CommercialRequestStatus[]>
> = {
  [CommercialRequestStatus.Draft]: [CommercialRequestStatus.Submitted],
  [CommercialRequestStatus.Submitted]: [
    CommercialRequestStatus.Approved,
    CommercialRequestStatus.Rejected,
  ],
  [CommercialRequestStatus.Approved]: [CommercialRequestStatus.Closed],
  [CommercialRequestStatus.Rejected]: [CommercialRequestStatus.Closed],
  [CommercialRequestStatus.Closed]: [],
} as const;

export const isCommercialRequestTransitionAllowed = (
  from: CommercialRequestStatus,
  to: CommercialRequestStatus,
): boolean => {
  return COMMERCIAL_REQUEST_ALLOWED_TRANSITIONS[from].includes(to);
};
