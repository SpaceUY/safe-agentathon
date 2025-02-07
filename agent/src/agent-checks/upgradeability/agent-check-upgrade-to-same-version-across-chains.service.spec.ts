import { Test, TestingModule } from '@nestjs/testing';
import { AgentCheckUpgradeToSameVersionAcrossChainsService } from './agent-check-upgrade-to-same-version-across-chains.service';

describe('AgentCheckUpgradeToSameVersionAcrossChainsService', () => {
  let service: AgentCheckUpgradeToSameVersionAcrossChainsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentCheckUpgradeToSameVersionAcrossChainsService],
    }).compile();

    service = module.get<AgentCheckUpgradeToSameVersionAcrossChainsService>(
      AgentCheckUpgradeToSameVersionAcrossChainsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
