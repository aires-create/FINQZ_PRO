import type { FastifyRequest } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../../types';

export const currentUser = (request: FastifyRequest) => {
  if (!request.currentUser) {
    throw new AuthenticationError('User is not authenticated');
  }
  return request.currentUser;
};

export const currentTenant = (request: FastifyRequest) => {
  if (!request.currentTenant) {
    throw new AuthorizationError('Tenant context is not available');
  }
  return request.currentTenant;
};
