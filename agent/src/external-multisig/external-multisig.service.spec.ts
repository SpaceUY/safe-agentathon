import { Test, TestingModule } from '@nestjs/testing';
import { ExternalMultisigService } from './external-multisig.service';

describe('ExternalMultisigService', () => {
  let service: ExternalMultisigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExternalMultisigService],
    }).compile();

    service = module.get<ExternalMultisigService>(ExternalMultisigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
