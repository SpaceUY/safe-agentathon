import { NestFactory } from '@nestjs/core';
import { AgentModule } from './agent.module';
import { HttpExceptionFilter } from './agent-exception.filter';
import { LoggerService } from './agent-logger/agent-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AgentModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
