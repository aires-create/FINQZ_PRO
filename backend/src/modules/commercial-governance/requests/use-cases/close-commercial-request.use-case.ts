import type {
  CloseCommercialRequestInput,
  CloseCommercialRequestResult,
} from '../contracts/close-commercial-request.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class CloseCommercialRequestUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: CloseCommercialRequestInput,
  ): Promise<CloseCommercialRequestResult> {
    return this.service.closeCommercialRequest(input);
  }
}
