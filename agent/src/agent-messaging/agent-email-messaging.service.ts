import { Inject, Injectable } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { env } from 'src/_common/config/config';
import { IAgentMessagingService } from './agent-messaging.interface.service';

@Injectable()
export class AgentEmailMessagingService implements IAgentMessagingService {
  constructor(
    @Inject('BREVO_CLIENT')
    private readonly brevoClient: SibApiV3Sdk.TransactionalEmailsApi,
  ) {}

  public async sendMessage(
    from: string,
    to: string,
    subject: string,
    html: string,
  ) {
    const emailData: SibApiV3Sdk.SendSmtpEmail = {
      sender: {
        email: env.BREVO_SENDER_EMAIL,
        name: `${env.BREVO_SENDER_NAME} ${from}`,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };

    return this.brevoClient.sendTransacEmail(emailData);
  }

  public async send2FACode(from: string, to: string) {
    try {
      console.log(`Sending email from: ${from} to ${to}`);
      const subject = '🚀 SafeRocket | 2FA Code Request Pending';
      const html = this.loadHtmlTemplate('2fa-email');

      return this.sendMessage(from, to, subject, html);
    } catch (ex) {
      console.log(ex);
    }
  }

  private loadHtmlTemplate(templateName: string): string {
    const filePath = path.resolve(
      './src/agent-messaging/templates',
      `${templateName}.html`,
    );
    return fs.readFileSync(filePath, 'utf-8');
  }
}
