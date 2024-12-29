export class MemcachedException extends Error {
  override name: string;
  override message: string;
  details?: string[];

  constructor({ message, details }: { message: string; details?: string[] }) {
    super(message);

    this.name = this.constructor.name;
    this.message = message;
    if (details) this.details = details;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(this.message).stack || '';
    }
  }
}
