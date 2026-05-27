export const normalizeFinancialProposalRawStatus = (rawStatus: string): string =>
  rawStatus
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();