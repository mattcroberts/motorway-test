import { expect, test, vi } from 'vitest';
import axios from 'axios';
import { FastifyInstance } from 'fastify';
import { fetchValuationFromSuperCarValuation } from './super-car-valuation';
import { VehicleValuation } from '../models/vehicle-valuation';
import { Source } from '@app/models/source';
import { SuperCarValuationResponse } from './types/super-car-valuation-response';

vi.mock('axios');

describe('fetchValuationFromSuperCarValuation', () => {
  const fastifyInstance: FastifyInstance = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
    },
    config: {
      superCarValuationApiUrl: 'https://api.example.com/valuations',
    },
  } as unknown as FastifyInstance;

  test('happy path', async () => {
    const vrm = 'ABC123';
    const mileage = 10000;
    const expectedValuation: Omit<VehicleValuation, 'midpointValue'> = {
      vrm,
      lowestValue: 15000,
      highestValue: 25000,
      source: Source.SUPER_CAR,
    };

    const response: SuperCarValuationResponse = {
      vin: '1234567890',
      registrationDate: '2022-01-01',
      plate: {
        year: 2022,
        month: 1,
      },
      valuation: {
        lowerValue: 15000,
        upperValue: 25000,
      },
    };

    vi.mocked(axios.get).mockResolvedValue({
      data: response,
    });

    const valuation = await fetchValuationFromSuperCarValuation(
      fastifyInstance,
      vrm,
      mileage,
    );

    expect(valuation).toEqual(expectedValuation);
  });

  test('error handling for axios call', async () => {
    const vrm = 'ABC123';
    const mileage = 10000;

    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    await expect(
      fetchValuationFromSuperCarValuation(fastifyInstance, vrm, mileage),
    ).rejects.toThrow('Network error');
  });
});
