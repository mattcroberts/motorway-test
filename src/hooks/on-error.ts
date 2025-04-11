import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export const onErrorHook = (fastify: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    fastify.log.info(
      { id: request.id, error: error.message, code: reply.statusCode },
      'Error occurred',
    );

    reply.context.error = error.message;
  };
};
