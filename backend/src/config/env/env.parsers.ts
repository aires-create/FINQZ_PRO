export const parsePort = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const port = Number(value);

  return Number.isInteger(port) && port >= 1 && port <= 65535
    ? port
    : undefined;
};

export const parsePositiveInteger = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0
    ? numberValue
    : undefined;
};

export const parseNonNegativeInteger = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue >= 0
    ? numberValue
    : undefined;
};