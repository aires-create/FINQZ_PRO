import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './app';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: config.swagger.title,
    version: config.swagger.version,
    description: config.swagger.description,
  },
  servers: [
    {
      url: `http://${config.host}:${config.port}`,
      description: 'Local server',
    },
  ],
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [path.join(process.cwd(), 'src/modules/**/*.ts')],
});
