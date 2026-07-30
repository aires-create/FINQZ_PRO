import type { EdpCommandEnvelope, EdpResponseEnvelope } from '../contracts/envelopes.js';
import { EDP_COMMAND_CATALOG, type EdpCommandName } from '../contracts/commands.js';
import { createCommandExecution } from './runtime-foundation.js';

export interface EdpCommandHandler {
  handle(command: EdpCommandEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>>;
}

export const createEdpCommandHandler = (commandName: EdpCommandName): EdpCommandHandler => ({
  async handle(command) {
    const { envelope } = await createCommandExecution(commandName, command);
    return envelope;
  },
});

export const edpCommandHandlers = Object.fromEntries(
  EDP_COMMAND_CATALOG.map((definition) => [
    definition.name,
    createEdpCommandHandler(definition.name),
  ]),
) as Record<EdpCommandName, EdpCommandHandler>;
