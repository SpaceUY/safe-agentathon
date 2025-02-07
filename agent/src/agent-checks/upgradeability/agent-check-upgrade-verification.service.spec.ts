import { Test, TestingModule } from '@nestjs/testing';
import { AgentCheckUpgradeVerificationService } from './agent-check-upgrade-verification.service';

describe('AgentCheckUpgradeVerificationService', () => {
  let service: AgentCheckUpgradeVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentCheckUpgradeVerificationService],
    }).compile();

    service = module.get<AgentCheckUpgradeVerificationService>(
      AgentCheckUpgradeVerificationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
