import { pipelinesRepository } from './repository.js';

export class PipelinesService {
  async listActiveByTenant(tenantId: string) {
    return pipelinesRepository.findActiveByTenant(tenantId);
  }
}

export const pipelinesService = new PipelinesService();
