import { DynamicModule, Module } from '@nestjs/common';
import { AgentInteractionGetSignerAddressService } from './agent-interaction-get-signer-address.service';
import { AgentInteractionGetOperationStatusService } from './agent-interaction-get-operation-status.service';
import { AgentInteractionPushTwoFAcodeService } from './agent-interaction-push-twofa-code.service';
import { AgentInteractionGetOperationDetailsService } from './agent-interaction-get-operation-details.service';
import { AgentInteractions } from 'src/agent-configuration';

@Module({})
export class AgentInteractionsModule {
  static register(): DynamicModule {
    return {
      module: AgentInteractionsModule,
      providers: [
        AgentInteractionPushTwoFAcodeService,
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
    };
  }
}
