import axios, { AxiosError, AxiosResponse } from 'axios';
import { parseStringPromise } from 'xml2js';
import { Source, VehicleValuation } from '../models/vehicle-valuation';

import { FastifyInstance } from 'fastify';
import { PremiumCarResponse } from './types/premium-car-response';

export async function fetchValuationFromPremiumCarValuation(
  fastify: FastifyInstance,
  vrm: string,
): Promise<VehicleValuation> {
  fastify.log.info(`Fetching valuation for ${vrm} from Premium API`);
  let xmlResponse: AxiosResponse<string>;
  try {
    xmlResponse = await axios.get<string>(`valueCar`, {
      params: { vrm },
      baseURL: fastify.config.premiumCarValuationApiUrl,
    });
  } catch (error) {
    fastify.log.error(
      'Error fetching valuation from Premium API:',
      (error as AxiosError).message,
    );
    throw error;
  }

  let responseAsJson: PremiumCarResponse;
  try {
    responseAsJson = await parseStringPromise(xmlResponse.data);
  } catch (error) {
    fastify.log.error(
      'Error transforming XML to JSON:',
      (error as AxiosError).message,
    );
    throw error;
  }

  const valuation = new VehicleValuation();

  valuation.vrm = vrm;
  valuation.lowestValue = parseFloat(
    responseAsJson.root.ValuationDealershipMinimum,
  );
  valuation.highestValue = parseFloat(
    responseAsJson.root.ValuationDealershipMaximum,
  );
  valuation.source = Source.PREMIUM;

  return valuation;
}
