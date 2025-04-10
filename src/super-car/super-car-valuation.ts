import axios, { AxiosResponse } from 'axios';

import { FastifyInstance } from 'fastify';
import { Source, VehicleValuation } from '../models/vehicle-valuation';
import { SuperCarValuationResponse } from './types/super-car-valuation-response';

export async function fetchValuationFromSuperCarValuation(
  fastify: FastifyInstance,
  vrm: string,
  mileage: number,
): Promise<VehicleValuation> {
  let response: AxiosResponse<SuperCarValuationResponse>;
  try {
    response = await axios.get<SuperCarValuationResponse>(
      `valuations/${vrm}?mileage=${mileage}`,
      {
        baseURL: fastify.config.superCarValuationApiUrl,
      },
    );
  } catch (error) {
    fastify.log.error(error, 'Error fetching valuation from SuperCar API:');
    throw error;
  }

  const valuation = new VehicleValuation();

  valuation.vrm = vrm;
  valuation.lowestValue = response.data.valuation.lowerValue;
  valuation.highestValue = response.data.valuation.upperValue;
  valuation.source = Source.SUPER_CAR;

  return valuation;
}
