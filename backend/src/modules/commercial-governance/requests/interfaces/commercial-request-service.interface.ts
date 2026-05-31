import type {
  CreateCommercialRequestInput,
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

export interface CommercialRequestService {
  createCommercialRequest(input: CreateCommercialRequestInput): Promise<CreateCommercialRequestResult>;
  submitCommercialRequest(input: SubmitCommercialRequestInput): Promise<SubmitCommercialRequestResult>;
  approveCommercialRequest(input: ApproveCommercialRequestInput): Promise<ApproveCommercialRequestResult>;
  rejectCommercialRequest(input: RejectCommercialRequestInput): Promise<RejectCommercialRequestResult>;
  closeCommercialRequest(input: CloseCommercialRequestInput): Promise<CloseCommercialRequestResult>;
  getCommercialRequestById(input: GetCommercialRequestByIdInput): Promise<GetCommercialRequestByIdResult>;
  listCommercialRequests(input: ListCommercialRequestsInput): Promise<ListCommercialRequestsResult>;
}
