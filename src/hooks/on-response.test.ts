import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { expect, test, vi } from 'vitest';
import { RequestAuditEntry } from '../models/request-audit';
import { onResponseHook } from './on-response';

describe('onResponseHook', () => {
  const fastifyInstance: FastifyInstance = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
    },
    orm: {
      getRepository: vi.fn().mockReturnValue({ insert: vi.fn() }),
    },
  } as unknown as FastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('inserts request audit entry with correct data', async () => {
    const request: FastifyRequest = {
      id: '123',
      url: '/api/endpoint',
      headers: {
        date: '2022-01-01T12:00:00Z',
      },
    } as unknown as FastifyRequest;
    const reply: FastifyReply = {
      context: {
        provider: 'example',
        vrm: 'ABC123',
      },
      statusCode: 200,
      elapsedTime: 500,
      headers: {
        date: '2022-01-01T12:00:00Z',
      },
      config: {},
    } as unknown as FastifyReply;

    const auditRepo = fastifyInstance.orm.getRepository(RequestAuditEntry);

    await onResponseHook(fastifyInstance)(request, reply);

    expect(auditRepo.insert).toHaveBeenCalledWith({
      id: '123',
      requestDate: new Date('2022-01-01T12:00:00Z'),
      requestDuration: 500,
      requestUrl: '/api/endpoint',
      responseCode: 200,
      provider: 'example',
      vrm: 'ABC123',
    });
  });

  test('logs error information when inserting request audit entry fails', async () => {
    const request: FastifyRequest = {
      id: '123',
      url: '/api/endpoint',
      headers: {
        date: '2022-01-01T12:00:00Z',
      },
    } as unknown as FastifyRequest;
    const reply: FastifyReply = {
      context: {
        provider: 'example',
        vrm: 'ABC123',
        error: 'Something went wrong',
      },
      statusCode: 200,
      elapsedTime: 500,
      headers: {
        date: '2022-01-01T12:00:00Z',
      },
      config: {},
    } as unknown as FastifyReply;
    const auditRepo = fastifyInstance.orm.getRepository(RequestAuditEntry);

    await onResponseHook(fastifyInstance)(request, reply);

    expect(auditRepo.insert).toHaveBeenCalledWith({
      id: '123',
      requestDate: new Date('2022-01-01T12:00:00Z'),
      requestDuration: 500,
      requestUrl: '/api/endpoint',
      responseCode: 200,
      provider: 'example',
      vrm: 'ABC123',
      error: 'Something went wrong',
    });
  });
});
