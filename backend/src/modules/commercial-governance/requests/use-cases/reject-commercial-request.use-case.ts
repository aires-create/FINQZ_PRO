import type {
  RejectCommercialRequestInput,
  RejectCommercialRequestResult,
} from '../contracts/reject-commercial-request.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class RejectCommercialRequestUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: RejectCommercialRequestInput,
  ): Promise<RejectCommercialRequestResult> {
    return this.service.rejectCommercialRequest(input);
  }
}
