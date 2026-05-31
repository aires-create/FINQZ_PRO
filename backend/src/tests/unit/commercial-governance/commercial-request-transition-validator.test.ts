import { describe, expect, it } from 'vitest';

import { CommercialRequestStatus } from '../../../modules/commercial-governance/requests/enums/commercial-request-status.enum.js';
import {
  CommercialRequestAlreadyClosedError,
  CommercialRequestNotSubmittedError,
  InvalidCommercialRequestTransitionError,
} from '../../../modules/commercial-governance/requests/domain/commercial-request-domain-errors.js';
import { validateCommercialRequestTransition } from '../../../modules/commercial-governance/requests/domain/commercial-request-transition-validator.js';

describe('validateCommercialRequestTransition', () => {
  describe('valid transitions', () => {
    const validTransitions: Array<[CommercialRequestStatus, CommercialRequestStatus]> = [
      [CommercialRequestStatus.Draft, CommercialRequestStatus.Submitted],
      [CommercialRequestStatus.Submitted, CommercialRequestStatus.Approved],
      [CommercialRequestStatus.Submitted, CommercialRequestStatus.Rejected],
      [CommercialRequestStatus.Approved, CommercialRequestStatus.Closed],
      [CommercialRequestStatus.Rejected, CommercialRequestStatus.Closed],
    ];

    it.each(validTransitions)('allows %s -> %s', (from, to) => {
      expect(() => validateCommercialRequestTransition(from, to)).not.toThrow();
    });
  });

  describe('invalid transitions', () => {
    it('throws CommercialRequestAlreadyClosedError for Closed -> Draft', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Closed,
          CommercialRequestStatus.Draft,
        ),
      ).toThrow(CommercialRequestAlreadyClosedError);
    });

    it('throws CommercialRequestAlreadyClosedError for Closed -> Submitted', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Closed,
          CommercialRequestStatus.Submitted,
        ),
      ).toThrow(CommercialRequestAlreadyClosedError);
    });

    it('throws InvalidCommercialRequestTransitionError for Approved -> Draft', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Approved,
          CommercialRequestStatus.Draft,
        ),
      ).toThrow(InvalidCommercialRequestTransitionError);
    });

    it('throws InvalidCommercialRequestTransitionError for Rejected -> Draft', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Rejected,
          CommercialRequestStatus.Draft,
        ),
      ).toThrow(InvalidCommercialRequestTransitionError);
    });

    it('throws CommercialRequestNotSubmittedError for Draft -> Approved', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Draft,
          CommercialRequestStatus.Approved,
        ),
      ).toThrow(CommercialRequestNotSubmittedError);
    });

    it('throws CommercialRequestNotSubmittedError for Draft -> Rejected', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Draft,
          CommercialRequestStatus.Rejected,
        ),
      ).toThrow(CommercialRequestNotSubmittedError);
    });

    it('throws InvalidCommercialRequestTransitionError for Submitted -> Draft', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Submitted,
          CommercialRequestStatus.Draft,
        ),
      ).toThrow(InvalidCommercialRequestTransitionError);
    });

    it('throws CommercialRequestNotSubmittedError for Approved -> Rejected', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Approved,
          CommercialRequestStatus.Rejected,
        ),
      ).toThrow(CommercialRequestNotSubmittedError);
    });

    it('throws CommercialRequestNotSubmittedError for Rejected -> Approved', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Rejected,
          CommercialRequestStatus.Approved,
        ),
      ).toThrow(CommercialRequestNotSubmittedError);
    });

    it('throws generic InvalidCommercialRequestTransitionError for non-special invalid transition', () => {
      expect(() =>
        validateCommercialRequestTransition(
          CommercialRequestStatus.Draft,
          CommercialRequestStatus.Closed,
        ),
      ).toThrow(InvalidCommercialRequestTransitionError);
    });
  });
});
