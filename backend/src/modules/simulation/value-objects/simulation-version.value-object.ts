export type SimulationVersionValueObject = Readonly<{
  value: string;
}>;

export const createSimulationVersion = (
  value: string,
): SimulationVersionValueObject => ({
  value: value.trim(),
});
