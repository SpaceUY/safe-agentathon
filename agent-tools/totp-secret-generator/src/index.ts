import * as speakeasy from "speakeasy";

function generateSecretKey(agentId: string): string {
  const secret = speakeasy.generateSecret({ name: `SafeRocket ${agentId}` });
  this._logger.info(`Secret key for ${agentId}: ${secret.base32}`);
  return secret.base32;
}

const agentId: string = "agent space";
generateSecretKey(agentId);
