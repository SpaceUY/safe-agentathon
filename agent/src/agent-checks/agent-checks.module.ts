import { DynamicModule, Provider } from '@nestjs/common';
import { AgentCheckUpgradeVerificationService } from './upgradeability/agent-check-upgrade-verification.service';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './upgradeability/agent-check-upgrade-to-same-version-across-chains.service';
import { AgentChecks, AgentConfiguration } from 'src/agent-configuration';

export class AgentChecksModule {
  static register(): DynamicModule {
    const providers: Provider[] = [];

    const agentChecksConfigured = AgentConfiguration.getAgentChecks();

    if (agentChecksConfigured.includes(AgentChecks.UPGRADE_VERIFICATION))
      providers.push({
        provide: AgentChecks.UPGRADE_VERIFICATION,
        useClass: AgentCheckUpgradeVerificationService,
      });

    if (
      agentChecksConfigured.includes(
        AgentChecks.UPGRADE_TO_SAME_VERSION_ACROSS_CHAINS,
      )
    )
      providers.push({
        provide: AgentChecks.UPGRADE_TO_SAME_VERSION_ACROSS_CHAINS,
        useClass: AgentCheckUpgradeToSameVersionAcrossChainsService,
      });

    return {
      module: AgentChecksModule,
      providers,
    };
  }
}
