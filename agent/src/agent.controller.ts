import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AgentService } from './agent.service.js';

@Controller()
export class AgentController {
  constructor(private readonly appService: AgentService) {}
  @Get()
  getInteract(@Query('interaction') interaction: string): Promise<any> {
    return this.appService.interact(interaction);
  }
  @Post()
  postInteract(
    @Query('interaction') interaction: string,
    @Body('params') params: any,
  ): Promise<any> {
    return this.appService.interact(interaction, params);
  }
}
