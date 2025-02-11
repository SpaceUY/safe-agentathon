import { Module } from '@nestjs/common';
import { AgentLocalSignerService } from './agent-local-signer.service';
import { IAgentSignerService } from './agent-signer.service.interface';

@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: 'IAgentSignerService', useClass: AgentLocalSignerService },
  ],
  exports: ['IAgentSignerService'],
})
export class AgentSignerModule {}
export { IAgentSignerService };
