import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentChecksModule } from './agent-checks/agent-checks.module';
import { AgentInteractionsModule } from './agent-interactions/agent-interactions.module';

const agentCheckModule = AgentChecksModule.register();
const agentInteractionsModule = AgentInteractionsModule.register();

@Module({
  imports: [agentCheckModule, agentInteractionsModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    ...agentCheckModule.providers!,
    ...agentInteractionsModule.providers!,
  ],
})
export class AgentModule {}
