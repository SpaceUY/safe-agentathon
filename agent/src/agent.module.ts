import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentChecksModule } from './agent-checks/agent-checks.module';
import { AgentCheckUpgradeVerificationService } from './agent-checks/upgradeability/agent-check-upgrade-verification.service';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './agent-checks/upgradeability/agent-check-upgrade-to-same-version-across-chains.service';
import { AgentInteractionsModule } from './agent-interactions/agent-interactions.module';
import { AgentInteractionGetSignerAddressService } from './agent-interactions/agent-interaction-get-signer-address.service';
import { AgentInteractionGetOperationStatusService } from './agent-interactions/agent-interaction-get-operation-status.service';
import { AgentInteractionPushTwoFAcodeService } from './agent-interactions/agent-interaction-push-twofa-code.service';

@Module({
  imports: [AgentChecksModule.register(), AgentInteractionsModule],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentCheckUpgradeVerificationService,
    AgentCheckUpgradeToSameVersionAcrossChainsService,
    AgentInteractionGetSignerAddressService,
    AgentInteractionGetOperationStatusService,
    AgentInteractionPushTwoFAcodeService,
  ],
})
export class AgentModule {}
