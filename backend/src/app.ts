// ============================================
// FINQZ PRO - Fastify Application Factory
// ============================================

import { buildFastifyApp } from './core/http/fastify';

/**
 * Creates and configures the Fastify application
 * with all necessary plugins and middleware
 */
async function createApp() {
  const app = await buildFastifyApp();
  // Additional plugins can be registered here if needed
  return app;
}

// Export for compatibility and direct usage
export default createApp;
export { createApp };
