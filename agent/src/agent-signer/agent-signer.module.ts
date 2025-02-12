import { Module } from '@nestjs/common';
import { AgentLocalSignerService } from './agent-local-signer.service';
import { IAgentSignerService } from './agent-signer.service.interface';

@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: 'AgentLocalSignerService', useClass: AgentLocalSignerService },
  ],
  exports: ['AgentLocalSignerService'],
})
export class AgentSignerModule {}
export { IAgentSignerService };
