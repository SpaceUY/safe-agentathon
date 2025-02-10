import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AgentInteractionGetSignerAddressService } from './agent-interaction-get-signer-address.service';
import { AgentInteractionGetOperationStatusService } from './agent-interaction-get-operation-status.service';
import { AgentInteractionPushTwoFAcodeService } from './agent-interaction-push-twofa-code.service';
import { AgentInteractionGetOperationDetailsService } from './agent-interaction-get-operation-details.service';
import { AgentConfiguration, AgentInteractions } from 'src/agent-configuration';

@Module({})
export class AgentInteractionsModule {
  static register(): DynamicModule {
    const providers: Provider[] = [];

    const agentInteractionsConfigured =
      AgentConfiguration.getAgentInteractions();

    if (
      agentInteractionsConfigured.includes(AgentInteractions.GET_SIGNER_ADDRESS)
    )
      providers.push({
        provide: AgentInteractions.GET_SIGNER_ADDRESS,
        useClass: AgentInteractionGetSignerAddressService,
      });

    if (
      agentInteractionsConfigured.includes(
        AgentInteractions.GET_OPERATION_STATUS,
      )
    )
      providers.push({
        provide: AgentInteractions.GET_OPERATION_STATUS,
        useClass: AgentInteractionGetOperationStatusService,
      });

    if (
      agentInteractionsConfigured.includes(
        AgentInteractions.GET_OPERATION_DETAILS,
      )
    )
      providers.push({
        provide: AgentInteractions.GET_OPERATION_DETAILS,
        useClass: AgentInteractionGetOperationDetailsService,
      });

    if (agentInteractionsConfigured.includes(AgentInteractions.PUSH_TWO_FACTOR))
      providers.push({
        provide: AgentInteractions.PUSH_TWO_FACTOR,
        useClass: AgentInteractionPushTwoFAcodeService,
      });

    return {
      module: AgentInteractionsModule,
      providers,
    };
  }
}
