import type { NovaPromotoraConnectionStatus } from './nova-promotora.types.js';

export async function testNovaPromotoraConnection(): Promise<NovaPromotoraConnectionStatus> {
  try {
    const response = await fetch(
      `${process.env.NOVA_PROMOTORA_BASE_URL}/api`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.NOVA_PROMOTORA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      connected: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}
