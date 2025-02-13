import {
  Abstract,
  DynamicModule,
  ForwardReference,
  Module,
  Provider,
} from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { AgentEmailMessagingService } from './agent-email-messaging.service';
import { env } from 'src/_common/config/config';
import { AgentConfiguration } from 'src/agent-configuration';
import { LoggerModule } from 'src/agent-logger/agent-logger.module';

@Module({})
export class AgentMessagingModule {
  static register(): DynamicModule {
    const providers: Provider[] = [];
    const exports: (
      | string
      | symbol
      | Function
      | DynamicModule
      | Provider
      | Abstract<any>
      | ForwardReference<any>
    )[] = [];

    const notificationTo = AgentConfiguration.getAgentNotificationTo();

    if (notificationTo) {
      if (notificationTo.type == 'email') {
        providers.push({
          provide: 'BrevoClient',
          useFactory: () => {
            const defaultClient = SibApiV3Sdk.ApiClient.instance;
            defaultClient.authentications['api-key'].apiKey = env.BREVO_API_KEY;
            return new SibApiV3Sdk.TransactionalEmailsApi();
          },
        });
        exports.push('BrevoClient');
        providers.push({
          provide: 'AgentMessagingService',
          useClass: AgentEmailMessagingService,
        });
        exports.push('AgentMessagingService');
      }
    }

    return {
      module: AgentMessagingModule,
      imports: [LoggerModule],
      providers,
      exports,
    };
  }
}
