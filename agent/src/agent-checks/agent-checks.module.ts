import { DynamicModule } from '@nestjs/common';
import { AgentCheckUpgradeVerificationService } from './upgradeability/agent-check-upgrade-verification.service';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './upgradeability/agent-check-upgrade-to-same-version-across-chains.service';
import { AgentChecks } from 'src/agent-configuration';

export class AgentChecksModule {
  static register(): DynamicModule {
    return {
      module: AgentChecksModule,
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
    };
  }
}
