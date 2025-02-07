import { Test, TestingModule } from '@nestjs/testing';
import { AgentInteractionGetOperationStatusService } from './agent-interaction-get-operation-status.service';

describe('AgentInteractionGetOperationStatusService', () => {
  let service: AgentInteractionGetOperationStatusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentInteractionGetOperationStatusService],
    }).compile();

    service = module.get<AgentInteractionGetOperationStatusService>(
      AgentInteractionGetOperationStatusService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
