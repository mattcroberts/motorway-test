import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RequestAuditEntry } from '../models/request-audit';

export const onErrorHook = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    fastify.log.info(
      { id: request.id, error: error.message, code: reply.statusCode },
      'Error occurred',
    );

    try {
      await fastify.orm.getRepository(RequestAuditEntry).update(
        {
          id: request.id,
        },
        {
          responseCode: reply.statusCode,
          error: error.message,
        },
      );
    } catch (error) {
      fastify.log.error(error, 'Error saving request audit entry');
    }
  };
};
