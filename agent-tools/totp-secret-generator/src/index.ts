import * as speakeasy from "speakeasy";

function generateSecretKey(agentId: string): string {
  const secret = speakeasy.generateSecret({ name: `SafeRocket ${agentId}` });
<<<<<<< HEAD
  this._logger.info(`Secret key for ${agentId}: ${secret.base32}`);
=======
  console.log(`Secret key for ${agentId}: ${secret.base32}`);
>>>>>>> main
  return secret.base32;
}

const agentId: string = "agent space";
generateSecretKey(agentId);
