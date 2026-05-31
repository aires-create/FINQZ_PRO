import type {
  CreateCommercialRequestPersistenceInput,
  CreateCommercialRequestResult,
} from '../contracts/create-commercial-request.contract.js';
import type {
  ApproveCommercialRequestInput,
  ApproveCommercialRequestResult,
} from '../contracts/approve-commercial-request.contract.js';
import type {
  CloseCommercialRequestInput,
  CloseCommercialRequestResult,
} from '../contracts/close-commercial-request.contract.js';
import type {
  GetCommercialRequestByIdInput,
  GetCommercialRequestByIdResult,
} from '../contracts/get-commercial-request-by-id.contract.js';
import type {
  ListCommercialRequestsInput,
  ListCommercialRequestsResult,
} from '../contracts/list-commercial-requests.contract.js';
import type {
  RejectCommercialRequestInput,
  RejectCommercialRequestResult,
} from '../contracts/reject-commercial-request.contract.js';
import type {
  SubmitCommercialRequestInput,
  SubmitCommercialRequestResult,
} from '../contracts/submit-commercial-request.contract.js';

export interface CommercialRequestRepository {
  create(input: CreateCommercialRequestPersistenceInput): Promise<CreateCommercialRequestResult>;
  findById(input: GetCommercialRequestByIdInput): Promise<GetCommercialRequestByIdResult>;
  list(input: ListCommercialRequestsInput): Promise<ListCommercialRequestsResult>;
  submit(input: SubmitCommercialRequestInput): Promise<SubmitCommercialRequestResult>;
  approve(input: ApproveCommercialRequestInput): Promise<ApproveCommercialRequestResult>;
  reject(input: RejectCommercialRequestInput): Promise<RejectCommercialRequestResult>;
  close(input: CloseCommercialRequestInput): Promise<CloseCommercialRequestResult>;
}
