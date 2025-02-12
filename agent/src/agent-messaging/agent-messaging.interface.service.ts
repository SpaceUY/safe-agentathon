export interface IAgentMessagingService {
  sendMessage(
    from: string,
    to: string,
    subject: string,
    html: string,
  ): Promise<void>;
  send2FACode(from: string, to: string): Promise<void>;
}
