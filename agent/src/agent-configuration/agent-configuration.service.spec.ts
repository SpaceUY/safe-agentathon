import { Test, TestingModule } from '@nestjs/testing';
import { AgentConfigurationService } from './agent-configuration.service';

describe('AgentConfigurationService', () => {
  let service: AgentConfigurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentConfigurationService],
    }).compile();

    service = module.get<AgentConfigurationService>(AgentConfigurationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
