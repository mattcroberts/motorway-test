import './env';
import 'reflect-metadata';

import { fastify as Fastify, FastifyServerOptions } from 'fastify';
import { valuationRoutes } from './routes/valuation';

import databaseConnection from 'typeorm-fastify-plugin';
import { VehicleValuation } from './models/vehicle-valuation';
import { CircuitBreaker } from './utils/circuit-breaker';
import { RequestAuditEntry } from './models/request-audit';
import { onResponseHook } from './hooks/on-response';
import { onErrorHook } from './hooks/on-error';

export const app = (opts?: FastifyServerOptions) => {
  const fastify = Fastify(opts);

  const circuitBreaker = new CircuitBreaker(fastify);

  fastify
    .register(databaseConnection, {
      type: 'sqlite',
      database: process.env.DATABASE_PATH!,
      synchronize: process.env.SYNC_DATABASE === 'true',
      logging: false,
      entities: [VehicleValuation, RequestAuditEntry],
      migrations: [],
      subscribers: [],
    })
    .decorate('config', {
      superCarValuationApiUrl: process.env.SUPER_CAR_VALUATION_API_URL!,
      premiumCarValuationApiUrl: process.env.PREMIUM_CAR_VALUATION_API_URL!,
    })
    .decorate('valuationCircuitBreaker', circuitBreaker)
    .addHook('onResponse', onResponseHook(fastify))
    .addHook('onError', onErrorHook(fastify))
    .ready();

  fastify.get('/', async () => {
    return { hello: 'world' };
  });

  valuationRoutes(fastify);

  return fastify;
};
