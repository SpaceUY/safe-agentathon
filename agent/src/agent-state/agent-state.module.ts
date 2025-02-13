import { Global, Module } from '@nestjs/common';
import { AgentMemoryStateService } from './agent-memory-state.service';
import { IAgentStateService } from './agent-state.service.interface';

export const AGENT_MEMORY_STATE_SERVICE = 'AgentMemoryStateService';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: AGENT_MEMORY_STATE_SERVICE, useClass: AgentMemoryStateService },
  ],
  exports: [AGENT_MEMORY_STATE_SERVICE],
})
export class AgentStateModule {}
export { IAgentStateService };
