import { Module } from '@nestjs/common';
import { LoggerService } from './agent-logger.service';

export const LOGGER_INTERFACE = 'LoggerInterface';

@Module({
  providers: [
    LoggerService,
    {
      provide: LOGGER_INTERFACE,
      useClass: LoggerService,
    },
  ],
  exports: [LOGGER_INTERFACE],
})
export class LoggerModule {}
