import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import BaseError from './_common/errors/base-error';
import NotAvailableError from './_common/errors/not-available.error';

@Catch(BaseError)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: BaseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { errorCode, errorMessage } = handleError(error);

    response.status(errorCode).json({
      statusCode: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
    });
  }
}

function handleError(err: Error): any {
  let errorCode;
  let errorMessage;
  let internalErrorMessage;

  if (err && NotAvailableError.prototype.isPrototypeOf(err)) {
    errorCode = 403;
    errorMessage = err.message;
  } else {
    errorCode = 500;
    internalErrorMessage = err.message;
    errorMessage = 'Unexpected error';
  }

  return {
    errorCode,
    errorMessage,
    internalErrorMessage,
  };
}
