export interface EdpIdempotencyEntry {
  idempotencyKey: string;
  correlationId: string;
  commandName?: string | null;
  queryName?: string | null;
  createdAt: string;
}

export class EdpIdempotencyStore {
  private readonly entries = new Map<string, EdpIdempotencyEntry>();

  get(key: string) {
    return this.entries.get(key) ?? null;
  }

  remember(entry: EdpIdempotencyEntry) {
    this.entries.set(entry.idempotencyKey, entry);
    return entry;
  }
}

export const edpIdempotencyStore = new EdpIdempotencyStore();
