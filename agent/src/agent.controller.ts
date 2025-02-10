import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AgentService } from './agent.service.js';

@Controller()
export class AgentController {
  constructor(private readonly appService: AgentService) {}
  @Get()
  getInteract(@Query('interaction') interactionKey: string): Promise<any> {
    return this.appService.performInteraction(interactionKey);
  }
  @Post()
  postInteract(
    @Query('interaction') interactionKey: string,
    @Body('params') params: any,
  ): Promise<any> {
    return this.appService.performInteraction(interactionKey, params);
  }
}
