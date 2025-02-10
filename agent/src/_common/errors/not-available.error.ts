import BaseError from './base-error';

class NotAvailableError extends BaseError {
  constructor(msg = '') {
    super('NotAvailableError' + (msg ? `: ${msg}` : ''));

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotAvailableError.prototype);
  }
}

export default NotAvailableError;
