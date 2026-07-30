import { CommercialRequestStatus } from '../enums/commercial-request-status.enum.js';
import {
  CommercialRequestAlreadyClosedError,
  CommercialRequestNotSubmittedError,
  InvalidCommercialRequestTransitionError,
} from './commercial-request-domain-errors.js';
import { isCommercialRequestTransitionAllowed } from './commercial-request-state-machine.js';

export const validateCommercialRequestTransition = (
  from: CommercialRequestStatus,
  to: CommercialRequestStatus,
): void => {
  if (from === CommercialRequestStatus.Closed) {
    throw new CommercialRequestAlreadyClosedError();
  }

  if (
    (to === CommercialRequestStatus.Approved ||
      to === CommercialRequestStatus.Rejected) &&
    from !== CommercialRequestStatus.Submitted
  ) {
    throw new CommercialRequestNotSubmittedError(from);
  }

  if (!isCommercialRequestTransitionAllowed(from, to)) {
    throw new InvalidCommercialRequestTransitionError(from, to);
  }
};
