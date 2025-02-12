import { Global, Module } from '@nestjs/common';
import { AgentMemoryStateService } from './agent-memory-state.service';
import { IAgentStateService } from './agent-state.service.interface';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [
    { provide: 'AgentMemoryStateService', useClass: AgentMemoryStateService },
  ],
  exports: ['AgentMemoryStateService'],
})
export class AgentStateModule {}
export { IAgentStateService };
