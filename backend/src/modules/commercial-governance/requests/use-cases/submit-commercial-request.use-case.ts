import type {
  SubmitCommercialRequestInput,
  SubmitCommercialRequestResult,
} from '../contracts/submit-commercial-request.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class SubmitCommercialRequestUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: SubmitCommercialRequestInput,
  ): Promise<SubmitCommercialRequestResult> {
    return this.service.submitCommercialRequest(input);
  }
}
