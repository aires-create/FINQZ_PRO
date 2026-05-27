import dotenv from 'dotenv';
import { z } from 'zod';

import { rawEnvSchema } from './env.schema.js';
import { transformEnv } from './env.transform.js';
import {
  validateCors,
  validateNumbers,
  validateProductionSecrets,
  validateRequiredEnv,
  validateBluepayConditionalConfig,
  validateSosBolsoConditionalConfig,
  validateSwaggerPath,
  validateUrls,
} from './env.validation.js';

dotenv.config();

export const envSchema = rawEnvSchema
  .superRefine((input, context) => {
    validateRequiredEnv(input, context);
    validateUrls(input, context);
    validateCors(input, context);
    validateProductionSecrets(input, context);
    validateNumbers(input, context);
    validateSwaggerPath(input, context);
    validateSosBolsoConditionalConfig(input, context);
    validateBluepayConditionalConfig(input, context);
  })
  .transform(transformEnv);

export type Env = Readonly<z.infer<typeof envSchema>>;

const formatEnvValidationError = (error: z.ZodError) => {
  const uniqueMessages = [
    ...new Set(
      error.issues.map((issue) => {
        const key = issue.path.join('.') || 'ENV';

        return `${key}: ${issue.message}`;
      }),
    ),
  ];

  return [
    'Environment validation failed.',
    ...uniqueMessages.map((message) => `- ${message}`),
    'Fix these variables before starting the backend. Values are hidden for security.',
  ].join('\n');
};

export const parseEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(formatEnvValidationError(result.error));
  }

  return Object.freeze(result.data);
};

export const env = parseEnv();
