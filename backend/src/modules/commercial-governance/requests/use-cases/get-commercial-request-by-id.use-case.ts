import type {
  GetCommercialRequestByIdInput,
  GetCommercialRequestByIdResult,
} from '../contracts/get-commercial-request-by-id.contract.js';
import type { CommercialRequestService } from '../interfaces/commercial-request-service.interface.js';

export class GetCommercialRequestByIdUseCase {
  constructor(private readonly service: CommercialRequestService) {}

  execute(
    input: GetCommercialRequestByIdInput,
  ): Promise<GetCommercialRequestByIdResult> {
    return this.service.getCommercialRequestById(input);
  }
}
