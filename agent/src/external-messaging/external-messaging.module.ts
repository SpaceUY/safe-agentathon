import { Module } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { ExternalMessagingService } from './external-messaging.service';
import { env } from 'src/_common/config';

@Module({
  providers: [
    {
      provide: 'BREVO_CLIENT',
      useFactory: () => {
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        defaultClient.authentications['api-key'].apiKey = env.BREVO_API_KEY;
        return new SibApiV3Sdk.TransactionalEmailsApi();
      },
    },
    ExternalMessagingService,
  ],
  controllers: [ExternalMessagingModule],
  exports: ['BREVO_CLIENT', ExternalMessagingService],
})
export class ExternalMessagingModule {}
