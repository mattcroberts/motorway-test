import { expect, test, vi } from 'vitest';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { onErrorHook } from './on-error';

describe('onErrorHook', () => {
  const fastifyInstance: FastifyInstance = {
    log: {
      info: vi.fn(),
    },
  } as unknown as FastifyInstance;

  test('logs error information and sets error message in reply context', async () => {
    const request: FastifyRequest = {} as unknown as FastifyRequest;
    const reply: FastifyReply = {
      context: {},
    } as unknown as FastifyReply;
    const error = new Error('Something went wrong');

    request.id = '123';

    await onErrorHook(fastifyInstance)(request, reply, error);

    expect(reply.context.error).toBe('Something went wrong');
  });
});
