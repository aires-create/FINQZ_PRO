import { serve } from "@hono/node-server";
import { createApp } from "./index";

const port = Number(process.env.PORT || 3000);

const mockEdgespark: any = {
  auth: {
    user: null,
  },
  db: {},
  secret: {
    get: (key: string) => process.env[key],
  },
};

const app = await createApp(mockEdgespark);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Backend FINQZ PRO rodando em http://localhost:${port}`);