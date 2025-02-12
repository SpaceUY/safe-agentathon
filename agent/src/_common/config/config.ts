export const env = {
  PORT: process.env.PORT ?? '',
  AGENT_PRIVATEKEY: process.env.AGENT_PRIVATEKEY ?? '',
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? '',
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL ?? '',
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME ?? '',
  CONFIG_FILE: process.env.CONFIG_FILE ?? './agent-config',
};
