import type { EdpEventEnvelope } from '../contracts/envelopes.js';
import { EDP_EVENT_CATALOG, type EdpEventDefinition, type EdpEventName } from '../contracts/events.js';

export interface EdpEventPublisher {
  readonly catalog: readonly EdpEventDefinition[];
  publish<TName extends EdpEventName, TPayload>(
    event: EdpEventEnvelope<TName, TPayload>,
  ): Promise<EdpEventEnvelope<TName, TPayload>>;
}

export class CatalogEventPublisher implements EdpEventPublisher {
  public readonly catalog = EDP_EVENT_CATALOG;
  private readonly allowedNames = new Set(EDP_EVENT_CATALOG.map((event) => event.name));
  private readonly publishedEvents: Array<EdpEventEnvelope<string, unknown>> = [];

  async publish<TName extends EdpEventName, TPayload>(
    event: EdpEventEnvelope<TName, TPayload>,
  ): Promise<EdpEventEnvelope<TName, TPayload>> {
    if (!this.allowedNames.has(event.name)) {
      throw new Error(`Event ${event.name} is not part of the canonical catalog`);
    }

    this.publishedEvents.push(event as EdpEventEnvelope<string, unknown>);
    return event;
  }

  getPublishedEvents(): readonly EdpEventEnvelope<string, unknown>[] {
    return this.publishedEvents;
  }
}

export const edpEventPublisher = new CatalogEventPublisher();
