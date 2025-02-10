import { NestFactory } from '@nestjs/core';
import { AgentModule } from './agent.module';
import { HttpExceptionFilter } from './agent-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AgentModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
