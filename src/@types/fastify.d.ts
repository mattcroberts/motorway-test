import { CircuitBreaker } from '@app/utils/circuit-breaker';
import { Source } from '@app/models/source';

declare module 'fastify' {
  export interface FastifyInstance {
    config: {
      superCarValuationApiUrl: string;
      premiumCarValuationApiUrl: string;
    };
    valuationCircuitBreaker: CircuitBreaker;
  }

  export interface FastifyReplyContext {
    vrm?: string;
    provider?: Source;
    error: string;
  }
}

declare const _default: FastifyPluginAsync<
  DBConfigOptions,
  import('fastify').RawServerDefault,
  import('fastify').FastifyTypeProviderDefault,
  import('fastify').FastifyBaseLogger
>;
export default _default;
