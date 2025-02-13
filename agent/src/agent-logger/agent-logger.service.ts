import { Injectable } from '@nestjs/common';
import pino from 'pino';
import pinoPretty from 'pino-pretty';
import { LoggerInterface } from './agent-logger.interface';

@Injectable()
export class LoggerService implements LoggerInterface {
  private readonly logger: pino.Logger;

  constructor() {
    const prettyStream = pinoPretty({
      colorize: true, // Activamos la colorización
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      timestampKey: 'time',
      messageKey: 'msg',
    });

    this.logger = pino(prettyStream);
  }

  log(message: string) {
    this.logger.info(message);
  }

  info(message: string) {
    this.logger.info(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  error(message: string) {
    this.logger.error(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  trace(message: string) {
    this.logger.trace(message);
  }
}
