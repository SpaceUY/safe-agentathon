import { Injectable } from '@nestjs/common';
import { AgentConfigurationService } from './agent-configuration';

@Injectable()
export class AgentService {
  constructor(private _agentConfigurationService: AgentConfigurationService) {}
}
