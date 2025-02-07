import { Controller, Get } from '../$node_modules/@nestjs/common/index.js';
import { AgentService } from './agent.service.js';

@Controller()
export class AgentController {
  constructor(private readonly appService: AgentService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
