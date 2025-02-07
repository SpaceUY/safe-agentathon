import { Test, TestingModule } from '@nestjs/testing';
import { AgentInteractionPush2FacodeService } from './agent-interaction-push2-facode.service';

describe('AgentInteractionPush2FacodeService', () => {
  let service: AgentInteractionPush2FacodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentInteractionPush2FacodeService],
    }).compile();

    service = module.get<AgentInteractionPush2FacodeService>(
      AgentInteractionPush2FacodeService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
