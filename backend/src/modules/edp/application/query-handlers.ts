import type { EdpQueryEnvelope, EdpResponseEnvelope } from '../contracts/envelopes.js';
import { EDP_QUERY_CATALOG, type EdpQueryName } from '../contracts/queries.js';
import { createQueryExecution } from './runtime-foundation.js';

export interface EdpQueryHandler {
  handle(query: EdpQueryEnvelope): Promise<EdpResponseEnvelope<Record<string, unknown>>>;
}

export const createEdpQueryHandler = (queryName: EdpQueryName): EdpQueryHandler => ({
  async handle(query) {
    const { envelope } = await createQueryExecution(queryName, query);
    return envelope;
  },
});

export const edpQueryHandlers = Object.fromEntries(
  EDP_QUERY_CATALOG.map((definition) => [
    definition.name,
    createEdpQueryHandler(definition.name),
  ]),
) as Record<EdpQueryName, EdpQueryHandler>;
