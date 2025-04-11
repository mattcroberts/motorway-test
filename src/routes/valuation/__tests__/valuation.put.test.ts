import { fastify } from '~root/test/fastify';
import { VehicleValuationRequest } from '../types/vehicle-valuation-request';
import AxiosMockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { SuperCarValuationResponse } from '@app/super-car/types/super-car-valuation-response';
import { mockValuationRepository } from './mockValuationRepository';
import { Source } from '@app/models/source';
import { VehicleValuation } from '@app/models/vehicle-valuation';

describe('ValuationController PUT (e2e)', () => {
  beforeAll(async () => {
    fastify.orm.getRepository = vi.fn().mockImplementation((clazz) => {
      if (clazz === VehicleValuation) {
        return mockValuationRepository;
      }
    });
  });

  beforeAll(() => {
    const mock = new AxiosMockAdapter(axios);

    const mockResponse: SuperCarValuationResponse = {
      vin: '12345678901234567',
      registrationDate: '2022-01-01',
      plate: {
        year: 2022,
        month: 1,
      },
      valuation: {
        lowerValue: 100000,
        upperValue: 150000,
      },
    };
    mock.onGet(/\/valuations\/ABC123\?mileage=10000$/).reply(200, mockResponse);
  });

  beforeEach(() => {
    mockValuationRepository.insert.mockReset();

    const cb = fastify.valuationCircuitBreaker;
    vi.spyOn(cb, 'call');

    cb.setPrimaryDown(false);
    cb.setSwitchoverDate(new Date());

    vi.clearAllMocks();
  });

  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request', async () => {
      mockValuationRepository.insert.mockResolvedValueOnce({});
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
    });

    it('should return 503 if both APIs fail', async () => {
      const mock = new AxiosMockAdapter(axios);
      mock.onGet(/\/valueCar$/).reply(500);

      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const cb = fastify.valuationCircuitBreaker;
      cb.setPrimaryDown(true);
      cb.setSwitchoverDate(new Date());
      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(503);
    });

    it('should not lookup valuation via any api if it exists in the database', async () => {
      mockValuationRepository.findOneBy.mockResolvedValueOnce({
        vrm: 'ABC1234',
        lowestValue: 100000,
        highestValue: 150000,
        source: Source.SUPER_CAR,
      });
      const cb = fastify.valuationCircuitBreaker;

      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC1234',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
      expect(res.json()).toEqual({
        vrm: 'ABC1234',
        lowestValue: 100000,
        highestValue: 150000,
        source: Source.SUPER_CAR,
      });
      expect(mockValuationRepository.findOneBy).toHaveBeenCalledWith({
        vrm: 'ABC1234',
      });
      expect(mockValuationRepository.insert).not.toHaveBeenCalled();

      expect(cb.call).not.toHaveBeenCalled();
    });
  });
});
