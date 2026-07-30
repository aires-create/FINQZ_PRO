export const isValidPipelineName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length > 0;
};

export const isValidStageName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length > 0;
};

export const isValidStageOrder = (order: number): boolean => {
  return Number.isInteger(order) && order >= 1;
};

export const isValidWonLostFlags = (input: { isWon: boolean; isLost: boolean }): boolean => {
  return !(input.isWon && input.isLost);
};

export const validatePipelineName = (name: string): void => {
  if (!isValidPipelineName(name)) {
    throw new Error('Pipeline name is required');
  }
};

export const validateStageName = (name: string): void => {
  if (!isValidStageName(name)) {
    throw new Error('Stage name is required');
  }
};

export const validateStageOrder = (order: number): void => {
  if (!isValidStageOrder(order)) {
    throw new Error('Stage order must be greater than or equal to 1');
  }
};

export const validateWonLostFlags = (input: { isWon: boolean; isLost: boolean }): void => {
  if (!isValidWonLostFlags(input)) {
    throw new Error('Stage cannot be won and lost at the same time');
  }
};
