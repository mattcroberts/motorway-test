import { FastifyInstance } from 'fastify';
import { GET } from './get';
import { PUT } from './put';

export function valuationRoutes(fastify: FastifyInstance) {
  GET(fastify);
  PUT(fastify);
}
