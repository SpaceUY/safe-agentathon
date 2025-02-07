import { Module } from '@nestjs/common';
import { AgentInteractionGetSignerAddressService } from './agent-interaction-get-signer-address.service';
import { AgentInteractionGetOperationStatusService } from './agent-interaction-get-operation-status.service';
import { AgentInteractionPush2FacodeService } from './agent-interaction-push2-facode.service';
import { AgentInteractions } from 'src/agent-configuration/models';
import { AgentInteractionGetOperationDetailsService } from './agent-interaction-get-operation-details.service';

@Module({
  providers: [
    AgentInteractionPush2FacodeService,
    {
      provide: AgentInteractions.GET_SIGNER_ADDRESS,
      useClass: AgentInteractionGetSignerAddressService,
    },
    {
      provide: AgentInteractions.GET_OPERATION_STATUS,
      useClass: AgentInteractionGetOperationStatusService,
    },
    {
      provide: AgentInteractions.GET_OPERATION_DETAILS,
      useClass: AgentInteractionGetOperationDetailsService,
    },
  ],
})
export class AgentInteractionsModule {}
