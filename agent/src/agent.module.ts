import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentChecksModule } from './agent-checks/agent-checks.module';
import { AgentInteractionsModule } from './agent-interactions/agent-interactions.module';
import { ExternalMultisigModule } from './external-multisig/external-multisig.module';
import { SafeMultisigService } from './external-multisig/safe-multisig.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentSignerModule } from './agent-signer/agent-signer.module';
import { AgentStateModule } from './agent-state/agent-state.module';
import { AgentMemoryStateService } from './agent-state/agent-memory-state.service';
import { ExternalMessagingModule } from './external-messaging/external-messaging.module';

const agentCheckModule = AgentChecksModule.register();
const agentInteractionsModule = AgentInteractionsModule.register();

@Module({
  imports: [
    agentCheckModule,
    agentInteractionsModule,
    ExternalMultisigModule,
    ScheduleModule.forRoot(),
    AgentSignerModule,
    AgentStateModule,
    ExternalMessagingModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    SafeMultisigService,
    ...agentCheckModule.providers!,
    ...agentInteractionsModule.providers!,
  ],
})
export class AgentModule {}
