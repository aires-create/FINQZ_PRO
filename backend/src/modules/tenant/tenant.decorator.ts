import { AuthenticationError, AuthorizationError } from '../../types';

export const currentUser = (request: any) => {
  if (!request.currentUser) {
    throw new AuthenticationError('User is not authenticated');
  }
  return request.currentUser;
};

export const currentTenant = (request: any) => {
  if (!request.currentTenant) {
    throw new AuthorizationError('Tenant context is not available');
  }
  return request.currentTenant;
};
