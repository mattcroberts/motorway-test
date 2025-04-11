export class CircuitBreakerError extends Error {
  public cause: Error;

  constructor(
    message: string,
    public type: string,
  ) {
    super(message);
  }
}
