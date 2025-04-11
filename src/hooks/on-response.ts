import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RequestAuditEntry } from '../models/request-audit';

export const onResponseHook = (fastify: FastifyInstance) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const auditRepo = fastify.orm.getRepository(RequestAuditEntry);
    try {
      const dateFromRequest = req.headers['date']; // this is the date header from the client, might want to use our own
      await auditRepo.insert({
        id: req.id,
        requestDate: new Date(dateFromRequest || Date.now()),
        requestDuration: res.elapsedTime,
        requestUrl: req.url,
        responseCode: res.statusCode,
        provider: res.context.provider,
        vrm: res.context.vrm,
        error: res.context.error,
      });
    } catch (error) {
      fastify.log.error(error, 'Error saving request audit entry');
    }
  };
};
