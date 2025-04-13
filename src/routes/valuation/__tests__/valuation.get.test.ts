import { fastify } from '~root/test/fastify';
import { mockValuationRepository } from './mockValuationRepository';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { RequestAuditEntry } from '@app/models/request-audit';
import { mockRequestAuditEntryRepository } from './mockRequestAuditEntryRepository';
import { Source } from '@app/models/source';

describe('ValuationController GET (e2e)', () => {
  beforeAll(async () => {
    fastify.orm.getRepository = vi.fn().mockImplementation((clazz) => {
      if (clazz === VehicleValuation) {
        return mockValuationRepository;
      } else if (clazz === RequestAuditEntry) {
        return mockRequestAuditEntryRepository;
      }
    });
  });

  beforeEach(() => {
    mockValuationRepository.findOneBy.mockReset();
    vi.clearAllMocks();
  });

  describe('GET /valuations/:vrm', () => {
    it('should return 400 if VRM is missing', async () => {
      const res = await fastify.inject({
        url: '/valuations/',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const res = await fastify.inject({
        url: '/valuations/12345678',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request', async () => {
      mockValuationRepository.findOneBy.mockResolvedValueOnce({
        vrm: 'ABC123',
        lowestValue: 1000,
        highestValue: 2000,
      });
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);
    });

    it('should return 404 if VRM does not exist', async () => {
      const res = await fastify.inject({
        url: '/valuations/XYZ123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(404);
    });
  });

  describe('auditing', () => {
    it('should add audit log for a failed request', async () => {
      mockValuationRepository.findOneBy.mockResolvedValueOnce(null);

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(404);

      expect(mockRequestAuditEntryRepository.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        requestDate: expect.any(Date),
        requestDuration: expect.any(Number),
        requestUrl: '/valuations/ABC123',
        responseCode: 404,
        error: undefined,
        provider: undefined,
        vrm: 'ABC123',
      });
    });

    it('should add audit log for a successful request', async () => {
      mockValuationRepository.findOneBy.mockResolvedValueOnce({
        vrm: 'ABC123',
        lowestValue: 1000,
        highestValue: 2000,
        source: Source.SUPER_CAR,
      });
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.statusCode).toStrictEqual(200);

      expect(mockRequestAuditEntryRepository.insert).toHaveBeenCalledWith({
        id: expect.any(String),
        requestDate: expect.any(Date),
        requestDuration: expect.any(Number),
        requestUrl: '/valuations/ABC123',
        responseCode: 200,
        error: undefined,
        provider: Source.SUPER_CAR,
        vrm: 'ABC123',
      });
    });
  });
});
