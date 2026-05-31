import type {
  ApproveCommercialRequestInput,
  ApproveCommercialRequestResult,
} from '../contracts/approve-commercial-request.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class ApproveCommercialRequestUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: ApproveCommercialRequestInput,
  ): Promise<ApproveCommercialRequestResult> {
    return this.service.approveCommercialRequest(input);
  }
}
