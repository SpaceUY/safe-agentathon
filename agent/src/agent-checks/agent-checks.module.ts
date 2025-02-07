import { Module } from '@nestjs/common';
import { AgentCheckUpgradeVerificationService } from './upgradeability/agent-check-upgrade-verification.service';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './upgradeability/agent-check-upgrade-to-same-version-across-chains.service';

@Module({
  providers: [
    {
      provide: 'upgrade-verification',
      useClass: AgentCheckUpgradeVerificationService,
    },
    {
      provide: 'upgrade-to-same-version-across-chains',
      useClass: AgentCheckUpgradeToSameVersionAcrossChainsService,
    },
  ],
})
export class AgentChecksModule {}
