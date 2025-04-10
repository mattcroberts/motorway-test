import { FastifyInstance } from 'fastify';
import { CircuitBreaker } from './circuit-breaker';

const mockFastify = {} as FastifyInstance;

describe('Circuit Breaker', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  it('should call the primary action when primary is UP', () => {
    const circuitBreaker = new CircuitBreaker(mockFastify);
    const action = vi.fn().mockResolvedValue('primary');
    const fallback = vi.fn().mockResolvedValue('fallback');

    const result = circuitBreaker.call(action, fallback);

    expect(action).toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
    expect(result).resolves.toBe('primary');
  });

  it('should call the fallback action when primary is down', () => {
    const circuitBreaker = new CircuitBreaker(mockFastify);
    circuitBreaker.setPrimaryDown(true);
    circuitBreaker.setSwitchoverDate(new Date());
    const action = vi.fn().mockResolvedValue('primary');
    const fallback = vi.fn().mockResolvedValue('fallback');

    const result = circuitBreaker.call(action, fallback);

    expect(action).not.toHaveBeenCalled();
    expect(fallback).toHaveBeenCalled();
    expect(result).resolves.toBe('fallback');
  });

  it('should switch to fallback when failure rate exceeds threshold', async () => {
    const circuitBreaker = new CircuitBreaker(mockFastify, 25);
    const action = vi.fn().mockRejectedValue('primary');
    const fallback = vi.fn().mockResolvedValue('fallback');

    await circuitBreaker.call(vi.fn().mockResolvedValue('success'), fallback);
    expect(fallback).not.toHaveBeenCalled();
    try {
      await circuitBreaker.call(action, fallback);
    } catch (e) {
      // The error is expected to be thrown by the circuit breaker
    }
    expect(fallback).not.toHaveBeenCalled();
    try {
      await circuitBreaker.call(action, fallback);
    } catch (e) {
      // The error is expected to be thrown by the circuit breaker
    }

    expect(fallback).toHaveBeenCalled();
  });

  it('should reset circuit state after reset timeout', async () => {
    const circuitBreaker = new CircuitBreaker(mockFastify, 25, 30000);
    circuitBreaker.setPrimaryDown(true);
    circuitBreaker.setSwitchoverDate(new Date());
    const action = vi.fn().mockResolvedValue('primary');
    const fallback = vi.fn().mockResolvedValue('fallback');

    await circuitBreaker.call(vi.fn().mockResolvedValue('success'), fallback);
    expect(fallback).toHaveBeenCalled();

    vi.advanceTimersByTime(31000);
    await circuitBreaker.call(action, fallback);

    expect(action).toHaveBeenCalled();
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
