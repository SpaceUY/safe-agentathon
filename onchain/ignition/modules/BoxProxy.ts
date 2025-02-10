import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BoxProxyModule = buildModule("BoxProxyModule", (m) => {
  const implementation = m.contract("Box");

  const networkName = m.getParameter("network", process.env.NETWORK_NAME);
  const networkKey = (networkName.defaultValue as string).toUpperCase();

  const multisigAddress = process.env[`MULTISIG_${networkKey}`];
  if (!multisigAddress) {
    throw new Error(
      `Multisig address for network ${networkKey} is missing. Please set MULTISIG_${networkKey} in your environment.`
    );
  }

  const initialize = m.encodeFunctionCall(implementation, "initialize", [
    10,
    multisigAddress,
  ]);
  const proxy = m.contract("BoxProxy", [implementation, initialize]);

  return { proxy };
});

export default BoxProxyModule;
