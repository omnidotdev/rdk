/**
 * Error raised when detection stops for good, carrying the underlying failure.
 */
class VisionStoppedError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "VisionStoppedError";
    this.cause = cause;
  }
}

export default VisionStoppedError;
