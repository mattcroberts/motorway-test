import { VehicleValuation } from '@app/models/vehicle-valuation';
import { FastifyInstance } from 'fastify';

export const GET = (fastify: FastifyInstance) => {
  fastify.get<{
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;

    if (vrm === null || vrm === '' || vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    const result = await valuationRepository.findOneBy({ vrm: vrm });

    if (result == null) {
      return reply.code(404).send({
        message: `Valuation for VRM ${vrm} not found`,
        statusCode: 404,
      });
    }

    return {
      ...result,
      source: result.source || 'UNKNOWN',
    };
  });
};
