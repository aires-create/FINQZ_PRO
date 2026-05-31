import type {
  CreateCommercialRequestInput,
  CreateCommercialRequestResult,
} from '../contracts/create-commercial-request.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class CreateCommercialRequestUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: CreateCommercialRequestInput,
  ): Promise<CreateCommercialRequestResult> {
    return this.service.createCommercialRequest(input);
  }
}
