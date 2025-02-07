import { Module } from '@nestjs/common';
import { AgentCheckUpgradeVerificationService } from './upgradeability/agent-check-upgrade-verification.service';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './upgradeability/agent-check-upgrade-to-same-version-across-chains.service';
import { AgentChecks } from 'src/agent-configuration/models';

@Module({
  providers: [
    {
      provide: AgentChecks.UPGRADE_VERIFICATION,
      useClass: AgentCheckUpgradeVerificationService,
    },
    {
      provide: AgentChecks.UPGRADE_TO_SAME_VERSION_ACROSS_CHAINS,
      useClass: AgentCheckUpgradeToSameVersionAcrossChainsService,
    },
  ],
})
export class AgentChecksModule {}
