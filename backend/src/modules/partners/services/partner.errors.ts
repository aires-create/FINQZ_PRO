export class PartnerNotFoundError extends Error {
  readonly partnerId?: string;
  readonly code?: string;

  constructor(identifier: string) {
    super(`Partner not found: ${identifier}`);
    this.name = 'PartnerNotFoundError';
    this.partnerId = identifier;
  }
}
