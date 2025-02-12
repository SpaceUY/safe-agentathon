import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { env } from 'src/_common/config';

@Injectable()
export class ExternalMessagingService {
  private readonly sender: { email: string; name: string };

  constructor(
    @Inject('BREVO_CLIENT')
    private readonly brevoClient: SibApiV3Sdk.TransactionalEmailsApi,
    private readonly configService: ConfigService,
  ) {
    this.sender = {
      email: env.BREVO_SENDER_EMAIL,
      name: env.BREVO_SENDER_NAME,
    };
  }

  // Function to send general email with embedded image
  public async sendEmail(to: string, subject: string, html: string) {
    const emailData: SibApiV3Sdk.SendSmtpEmail = {
      sender: this.sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    };

    return this.brevoClient.sendTransacEmail(emailData);
  }

  // Function to send 2FA code email
  public async send2FACodeEmail(to: string) {
    const subject = '🚀 SafeRocket | 2FA Code Request Pending';
    const html = this.loadHtmlTemplate('2fa-email');

    return this.sendEmail(to, subject, html);
  }

  private loadHtmlTemplate(templateName: string): string {
    const filePath = path.resolve(
      'src/notifications/templates',
      `${templateName}.html`,
    );
    return fs.readFileSync(filePath, 'utf-8');
  }
}
