import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

import { edpCommandHandlers } from '../../application/command-handlers.js';
import { edpQueryHandlers } from '../../application/query-handlers.js';
import type { EdpFastifyRequest } from '../../contracts/envelopes.js';
import { EDP_COMMAND_CATALOG } from '../../contracts/commands.js';
import { EDP_QUERY_CATALOG } from '../../contracts/queries.js';
import { validateEdpCommandEnvelope, validateEdpQueryEnvelope } from '../../validators/index.js';

const asEdpRequest = (request: FastifyRequest) => request as EdpFastifyRequest;

const buildFallbackCorrelationId = (request: FastifyRequest) =>
  asEdpRequest(request).edpContext?.correlationId ?? request.id ?? randomUUID();

export const edpController = {
  async runtime(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      status: 'ready',
      service: 'EDP Runtime Foundation',
      modules: [...new Set(EDP_COMMAND_CATALOG.map((item) => item.owner))],
      commands: EDP_COMMAND_CATALOG.map((item) => item.name),
      queries: EDP_QUERY_CATALOG.map((item) => item.name),
    });
  },

  async handleCommand(request: FastifyRequest, reply: FastifyReply) {
    const commandName = (request.params as { commandName?: string }).commandName ?? '';
    const body = request.body as Record<string, unknown>;
    const correlationId = buildFallbackCorrelationId(request);
    const tenantId = request.currentTenant?.tenantId ?? request.currentUser?.tenantId;

    if (!tenantId) {
      return reply.status(400).send({
        error: 'Missing tenant context',
        correlationId,
      });
    }

    if (!validateEdpCommandName(commandName)) {
      return reply.status(400).send({
        error: 'Invalid command name',
        correlationId,
      });
    }

    if (!validateEdpCommandEnvelope(body)) {
      return reply.status(400).send({
        error: 'Invalid command envelope',
        correlationId,
      });
    }

    const handler = edpCommandHandlers[commandName as keyof typeof edpCommandHandlers];

    if (!handler) {
      return reply.status(404).send({
        error: 'Command not part of the canonical runtime foundation',
        correlationId,
      });
    }

    const result = await handler.handle(body);
    return reply.send(result);
  },

  async handleQuery(request: FastifyRequest, reply: FastifyReply) {
    const queryName = (request.params as { queryName?: string }).queryName ?? '';
    const body = request.body as Record<string, unknown>;
    const correlationId = buildFallbackCorrelationId(request);

    if (!validateEdpQueryName(queryName)) {
      return reply.status(400).send({
        error: 'Invalid query name',
        correlationId,
      });
    }

    if (!validateEdpQueryEnvelope(body)) {
      return reply.status(400).send({
        error: 'Invalid query envelope',
        correlationId,
      });
    }

    const handler = edpQueryHandlers[queryName as keyof typeof edpQueryHandlers];

    if (!handler) {
      return reply.status(404).send({
        error: 'Query not part of the canonical runtime foundation',
        correlationId,
      });
    }

    const result = await handler.handle(body);
    return reply.send(result);
  },
};

function validateEdpCommandName(value: string) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateEdpQueryName(value: string) {
  return typeof value === 'string' && value.trim().length > 0;
}
