import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ExternalMultisigService } from './external-multisig/external-multisig.service';
import { ExternalMultisigModule } from './external-multisig/external-multisig.module';
import { AgentConfigurationModule } from './agent-configuration/agent-configuration.module';
import { AgentChecksService } from './agent-checks/agent-checks.service';
import { AgentChecksModule } from './agent-checks/agent-checks.module';
import { AgentCheckUpgradeVerificationService } from './agent-checks/upgradeability/agent-check-upgrade-verification.service';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './agent-checks/upgradeability/agent-check-upgrade-to-same-version-across-chains.service';
import { AgentInteractionsModule } from './agent-interactions/agent-interactions.module';
import { AgentInteractionGetSignerAddressService } from './agent-interactions/agent-interaction-get-signer-address.service';
import { AgentInteractionGetOperationStatusService } from './agent-interactions/agent-interaction-get-operation-status.service';
import { AgentInteractionPush2FacodeService } from './agent-interactions/agent-interaction-push2-facode.service';

@Module({
  imports: [
    ExternalMultisigModule,
    AgentConfigurationModule,
    AgentChecksModule,
    AgentInteractionsModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    ExternalMultisigService,
    AgentChecksService,
    AgentCheckUpgradeVerificationService,
    AgentCheckUpgradeToSameVersionAcrossChainsService,
    AgentInteractionGetSignerAddressService,
    AgentInteractionGetOperationStatusService,
    AgentInteractionPush2FacodeService,
  ],
})
export class AgentModule {}
