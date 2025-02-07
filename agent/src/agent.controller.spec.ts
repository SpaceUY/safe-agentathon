import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

describe('AgentController', () => {
  let agentController: AgentController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [AgentService],
    }).compile();

    agentController = app.get<AgentController>(AgentController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(agentController.getHello()).toBe('Hello World!');
    });
  });
});
