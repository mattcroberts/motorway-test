export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public type: string,
  ) {
    super(message);
  }
}
