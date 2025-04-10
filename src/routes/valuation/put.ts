import { VehicleValuation } from '@app/models/vehicle-valuation';
import { fetchValuationFromSuperCarValuation } from '@app/super-car/super-car-valuation';
import { FastifyInstance } from 'fastify';
import { VehicleValuationRequest } from './types/vehicle-valuation-request';
import { fetchValuationFromPremiumCarValuation } from '@app/premium-car/premium-car-valuation';
import { CircuitBreakerError } from '@app/CircuitBreakerError';

export const PUT = (fastify: FastifyInstance) => {
  fastify.put<{
    Body: VehicleValuationRequest;
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const circuitBreaker = fastify.valuationCircuitBreaker;
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;
    const { mileage } = request.body;

    if (vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    if (mileage === null || mileage <= 0) {
      return reply.code(400).send({
        message: 'mileage must be a positive number',
        statusCode: 400,
      });
    }

    const result = await valuationRepository.findOneBy({ vrm: vrm });
    if (result) {
      return {
        ...result,
        source: result.source || 'UNKNOWN',
      };
    }

    let valuation;
    try {
      valuation = await circuitBreaker.call(
        () => fetchValuationFromSuperCarValuation(fastify, vrm, mileage),
        () => fetchValuationFromPremiumCarValuation(fastify, vrm),
      );
    } catch (error) {
      fastify.log.error(error, 'Error fetching valuation');

      if ((error as CircuitBreakerError).type === 'FALLBACK_ERROR') {
        return reply.code(503).send({
          message: 'Service temporarily unavailable',
          statusCode: 503,
        });
      }

      throw error;
    }

    await valuationRepository.insert(valuation).catch((err) => {
      if (err.code !== 'SQLITE_CONSTRAINT') {
        throw err;
      }
    });

    fastify.log.info('Valuation saved');

    return valuation;
  });
};
