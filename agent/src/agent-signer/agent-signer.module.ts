import { Module } from '@nestjs/common';
import { AgentLocalSignerService } from './agent-local-signer.service';

@Module({
  imports: [],
  controllers: [],
  providers: [AgentLocalSignerService],
})
export class AgentSignerModule {}
export { AgentLocalSignerService };
