import type { CreateOperationCommand } from '../application/operation.commands.js';
import type {
  GetOperationByIdQuery,
  GetOperationByNumberQuery,
  ListOperationsQuery,
} from '../application/operation.queries.js';
import type { OperationDTO } from '../dto/operation.dto.js';
import type {
  CreateOperationHandlerContract,
  GetOperationByIdHandlerContract,
  GetOperationByNumberHandlerContract,
  ListOperationsHandlerContract,
  OperationExecutionContext,
} from './operation.handlers.contract.js';
import { operationService } from '../services/operation.service.js';
import type { OperationServiceContract } from '../services/operation.service.contract.js';
import type { OperationListResult } from '../services/operation.service.contract.js';

export class CreateOperationHandler implements CreateOperationHandlerContract {
  constructor(private readonly service: OperationServiceContract = operationService) {}

  handle(command: CreateOperationCommand, _context: OperationExecutionContext): Promise<OperationDTO> {
    return this.service.createOperation(command);
  }
}

export class GetOperationByIdHandler implements GetOperationByIdHandlerContract {
  constructor(private readonly service: OperationServiceContract = operationService) {}

  handle(query: GetOperationByIdQuery, _context: OperationExecutionContext): Promise<OperationDTO | null> {
    return this.service.getOperationById(query);
  }
}

export class GetOperationByNumberHandler implements GetOperationByNumberHandlerContract {
  constructor(private readonly service: OperationServiceContract = operationService) {}

  handle(
    query: GetOperationByNumberQuery,
    _context: OperationExecutionContext,
  ): Promise<OperationDTO | null> {
    return this.service.getOperationByNumber(query);
  }
}

export class ListOperationsHandler implements ListOperationsHandlerContract {
  constructor(private readonly service: OperationServiceContract = operationService) {}

  handle(query: ListOperationsQuery, _context: OperationExecutionContext): Promise<OperationListResult> {
    return this.service.listOperations(query);
  }
}

export const createOperationHandler = new CreateOperationHandler();
export const getOperationByIdHandler = new GetOperationByIdHandler();
export const getOperationByNumberHandler = new GetOperationByNumberHandler();
export const listOperationsHandler = new ListOperationsHandler();
