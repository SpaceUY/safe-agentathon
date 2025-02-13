import { Module } from '@nestjs/common';
import { AgentLocalSignerService } from './agent-local-signer.service';
import { IAgentSignerService } from './agent-signer.service.interface';

export const AGENT_LOCAL_SIGNER_SERVICE = 'AgentLocalSignerService';

@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: AGENT_LOCAL_SIGNER_SERVICE, useClass: AgentLocalSignerService },
  ],
  exports: [AGENT_LOCAL_SIGNER_SERVICE],
})
export class AgentSignerModule {}
export { IAgentSignerService };
