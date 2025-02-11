import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentChecksModule } from './agent-checks/agent-checks.module';
import { AgentInteractionsModule } from './agent-interactions/agent-interactions.module';
import { ExternalMultisigModule } from './external-multisig/external-multisig.module';
import { SafeMultisigService } from './external-multisig/safe-multisig.service';
import { ScheduleModule } from '@nestjs/schedule';
import {
  AgentLocalSignerService,
  AgentSignerModule,
} from './agent-signer/agent-signer.module';

const agentCheckModule = AgentChecksModule.register();
const agentInteractionsModule = AgentInteractionsModule.register();

@Module({
  imports: [
    agentCheckModule,
    agentInteractionsModule,
    ExternalMultisigModule,
    ScheduleModule.forRoot(),
    AgentSignerModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    SafeMultisigService,
    AgentLocalSignerService,
    ...agentCheckModule.providers!,
    ...agentInteractionsModule.providers!,
  ],
})
export class AgentModule {}
