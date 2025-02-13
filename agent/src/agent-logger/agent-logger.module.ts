import { Module } from '@nestjs/common';
import { LoggerService } from './agent-logger.service';

@Module({
  providers: [
    LoggerService,
    {
      provide: 'Logger',
      useClass: LoggerService,
    },
  ],
  exports: ['Logger'],
})
export class LoggerModule {}
