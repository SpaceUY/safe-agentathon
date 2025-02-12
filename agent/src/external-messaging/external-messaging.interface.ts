// src/external-messaging/external-messaging.interface.ts

export interface ExternalMessaging {
  sendEmail(to: string, subject: string, html: string): Promise<any>;
  send2FACodeEmail(to: string): Promise<any>;
}
