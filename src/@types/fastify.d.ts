import { CircuitBreaker } from '@app/circuit-breaker';

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      superCarValuationApiUrl: string;
      premiumCarValuationApiUrl: string;
    };
    valuationCircuitBreaker: CircuitBreaker;
  }
}

declare const _default: FastifyPluginAsync<
  DBConfigOptions,
  import('fastify').RawServerDefault,
  import('fastify').FastifyTypeProviderDefault,
  import('fastify').FastifyBaseLogger
>;
export default _default;
