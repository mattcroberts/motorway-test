import { fastify } from '~root/test/fastify';
import { mockValuationRepository } from './mockValuationRepository';

describe('ValuationController GET (e2e)', () => {
  describe('GET /valuations/:vrm', () => {
    beforeAll(async () => {
      fastify.orm.getRepository = vi
        .fn()
        .mockReturnValue(mockValuationRepository);
    });

    beforeEach(() => {
      mockValuationRepository.findOneBy.mockReset();
    });
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
});
