import { FastifyInstance } from 'fastify';
import { CircuitBreakerError } from './CircuitBreakerError';

export class CircuitBreaker {
  private primaryErrorCount = 0;
  private secondaryErrorCount = 0;
  private totalPrimaryRequests = 0;
  private totalSecondaryRequests = 0;
  private primaryDown = false;
  private switchoverDate: Date;

  constructor(
    private fastify: FastifyInstance,
    private failureRateThreshold = 50,
    private resetTimeout = 30000,
  ) {}

  get primaryFailureRate(): number {
    if (this.totalPrimaryRequests === 0) return 0;
    return (this.primaryErrorCount / this.totalPrimaryRequests) * 100;
  }

  setPrimaryDown(value: boolean) {
    this.primaryDown = value;
  }

  setSwitchoverDate(date: Date) {
    this.switchoverDate = date;
  }

  private updateCircuitState(): void {
    if (this.primaryFailureRate > this.failureRateThreshold) {
      this.primaryDown = true;
      this.switchoverDate = new Date();
    } else if (
      this.primaryDown &&
      new Date().getTime() - this.switchoverDate.getTime() > this.resetTimeout
    ) {
      this.primaryDown = false;
      this.primaryErrorCount = 0;
    }
  }

  async call<T>(
    action: () => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    this.updateCircuitState();

    if (this.primaryDown) {
      try {
        return await fallback();
      } catch (error) {
        this.secondaryErrorCount++;
        const err = new CircuitBreakerError(
          'Fallback action failed',
          'FALLBACK_ERROR',
        );
        err.cause = error;

        this.fastify.log.error(err, 'Error executing fallback action:');

        throw err;
      } finally {
        this.totalSecondaryRequests++;
      }
    }

    try {
      return await action();
    } catch (error) {
      this.primaryErrorCount++;

      const err = new CircuitBreakerError(
        'Primary action failed',
        'PRIMARY_ERROR',
      );
      err.cause = error;

      throw err;
    } finally {
      this.totalPrimaryRequests++;
    }
  }
}
