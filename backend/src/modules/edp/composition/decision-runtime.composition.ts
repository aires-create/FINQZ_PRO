import { EdpContractViolationError } from '../domain/exceptions.js';
import { PrismaEdpUnitOfWork } from '../application/unit-of-work.js';
import { createPrismaEdpRepositoryRegistry } from '../infrastructure/prisma/repositories.js';

export type DecisionRuntimeRepositoryRegistry = ReturnType<typeof createPrismaEdpRepositoryRegistry>;

export interface DecisionRuntimeCompositionDependencies {
  unitOfWork: PrismaEdpUnitOfWork;
  repositoryRegistry: DecisionRuntimeRepositoryRegistry;
}

export interface DecisionRuntimeStep {
  execute(input: unknown): Promise<void>;
}

export interface DecisionRuntimeUseCaseBundle {
  decisionContext: DecisionRuntimeStep;
  policyEvaluation: DecisionRuntimeStep;
  strategyResolution: DecisionRuntimeStep;
  decisionEngine: DecisionRuntimeStep;
  decisionResult: DecisionRuntimeStep;
}

export interface DecisionRuntimeComposition {
  unitOfWork: PrismaEdpUnitOfWork;
  repositoryRegistry: DecisionRuntimeRepositoryRegistry;
  useCases: DecisionRuntimeUseCaseBundle;
}

const createSkeletonStep = (stepName: string): DecisionRuntimeStep => ({
  async execute(): Promise<void> {
    throw new EdpContractViolationError(
      `Decision Runtime skeleton step "${stepName}" is not implemented yet`,
    );
  },
});

export const createDecisionRuntimeUseCases = (
  _dependencies: DecisionRuntimeCompositionDependencies,
): DecisionRuntimeUseCaseBundle => ({
  decisionContext: createSkeletonStep('decisionContext'),
  policyEvaluation: createSkeletonStep('policyEvaluation'),
  strategyResolution: createSkeletonStep('strategyResolution'),
  decisionEngine: createSkeletonStep('decisionEngine'),
  decisionResult: createSkeletonStep('decisionResult'),
});

export const createDecisionRuntimeComposition = (
  dependencies: DecisionRuntimeCompositionDependencies,
): DecisionRuntimeComposition => ({
  unitOfWork: dependencies.unitOfWork,
  repositoryRegistry: dependencies.repositoryRegistry,
  useCases: createDecisionRuntimeUseCases(dependencies),
});
