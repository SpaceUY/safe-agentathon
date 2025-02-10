export function getMultisigAddress(): string {
  const networkName = process.env.NETWORK_NAME;

  if (!networkName || typeof networkName !== "string" || !networkName.trim()) {
    throw new Error("Invalid network name. Please provide a valid network.");
  }

  const networkKey = networkName.trim().toUpperCase();
  const multisig = process.env[`MULTISIG_${networkKey}`];

  if (!multisig) {
    throw new Error(`Multisig address for network ${networkKey} is missing.`);
  }

  return multisig;
}
