import { Module } from '@nestjs/common';
import { AgentInteractionGetSignerAddressService } from './agent-interaction-get-signer-address.service';
import { AgentInteractionGetOperationStatusService } from './agent-interaction-get-operation-status.service';
import { AgentInteractionPush2FacodeService } from './agent-interaction-push2-facode.service';

@Module({
  providers: [
    AgentInteractionPush2FacodeService,
    {
      provide: 'get-signer-address',
      useClass: AgentInteractionGetSignerAddressService,
    },
    {
      provide: 'get-operation-status"]',
      useClass: AgentInteractionGetOperationStatusService,
    },
  ],
})
export class AgentInteractionsModule {}
