import type {
  ListCommercialRequestsInput,
  ListCommercialRequestsResult,
} from '../contracts/list-commercial-requests.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class ListCommercialRequestsUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: ListCommercialRequestsInput,
  ): Promise<ListCommercialRequestsResult> {
    return this.service.listCommercialRequests(input);
  }
}
