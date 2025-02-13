import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentChecksModule } from './agent-checks/agent-checks.module';
import { AgentInteractionsModule } from './agent-interactions/agent-interactions.module';
import { ExternalMultisigModule } from './external-multisig/external-multisig.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AgentSignerModule } from './agent-signer/agent-signer.module';
import { AgentStateModule } from './agent-state/agent-state.module';
import { AgentMessagingModule } from './agent-messaging/agent-messaging.module';
import { LoggerModule } from './agent-logger/agent-logger.module';

const agentCheckModule = AgentChecksModule.register();
const agentInteractionsModule = AgentInteractionsModule.register();
const agentMessagingModule = AgentMessagingModule.register();

@Module({
  imports: [
    agentCheckModule,
    agentInteractionsModule,
    ExternalMultisigModule,
    ScheduleModule.forRoot(),
    AgentSignerModule,
    AgentStateModule,
    agentMessagingModule,
    LoggerModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    ...agentCheckModule.providers!,
    ...agentInteractionsModule.providers!,
    ...agentMessagingModule.providers!,
  ],
})
export class AgentModule {}
