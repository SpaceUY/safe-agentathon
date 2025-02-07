import { Test, TestingModule } from '@nestjs/testing';
import { AgentInteractionGetSignerAddressService } from './agent-interaction-get-signer-address.service';

describe('AgentInteractionGetSignerAddressService', () => {
  let service: AgentInteractionGetSignerAddressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentInteractionGetSignerAddressService],
    }).compile();

    service = module.get<AgentInteractionGetSignerAddressService>(
      AgentInteractionGetSignerAddressService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
