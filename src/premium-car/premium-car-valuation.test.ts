import { FastifyInstance } from 'fastify';
import { fetchValuationFromPremiumCarValuation } from './premium-car-valuation';
import { VehicleValuation } from '../models/vehicle-valuation';
import { Source } from '../models/source';

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { Mock } from 'vitest';

vi.mock('axios');
vi.mock('xml2js');

describe('fetchValuationFromPremiumCarValuation', () => {
  const fastifyInstance: FastifyInstance = {
    log: {
      info: vi.fn(),
      error: vi.fn(),
    },
    config: {
      premiumCarValuationApiUrl: 'https://api.example.com/valuations',
    },
  } as unknown as FastifyInstance;

  vi.mocked(parseStringPromise).mockResolvedValue({
    root: {
      ValuationDealershipMinimum: '10000',
      ValuationDealershipMaximum: '20000',
    },
  });

  test('happy path', async () => {
    const vrm = 'ABC123';
    const expectedValuation: Omit<VehicleValuation, 'midpointValue'> = {
      vrm,
      lowestValue: 10000,
      highestValue: 20000,
      source: Source.PREMIUM,
    };

    (axios.get as Mock).mockResolvedValue({
      data: `
        <root>
          <ValuationDealershipMinimum>10000</ValuationDealershipMinimum>
          <ValuationDealershipMaximum>20000</ValuationDealershipMaximum>
        </root>
      `,
    });

    const valuation = await fetchValuationFromPremiumCarValuation(
      fastifyInstance,
      vrm,
    );

    expect(valuation).toEqual(expectedValuation);
    expect(axios.get).toHaveBeenCalledWith('valueCar', {
      baseURL: 'https://api.example.com/valuations',
      params: {
        vrm,
      },
    });
  });

  test('error handling for axios call', async () => {
    const vrm = 'ABC123';

    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    await expect(
      fetchValuationFromPremiumCarValuation(fastifyInstance, vrm),
    ).rejects.toThrow('Network error');
  });

  test('error handling for XML to JSON conversion', async () => {
    const vrm = 'ABC123';

    vi.mocked(axios.get).mockResolvedValue({
      data: '<invalid-xml>',
    });

    (parseStringPromise as Mock).mockRejectedValue(
      new Error('XML parsing error'),
    );

    await expect(
      fetchValuationFromPremiumCarValuation(fastifyInstance, vrm),
    ).rejects.toThrow('XML parsing error');
  });
});
