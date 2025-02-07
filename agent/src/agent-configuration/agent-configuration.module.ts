import { Module } from '@nestjs/common';
import { AgentConfigurationService } from './agent-configuration.service';

@Module({
  providers: [AgentConfigurationService]
})
export class AgentConfigurationModule {}
