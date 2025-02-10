// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BoxProxyModule = buildModule("BoxProxyModule", (m) => {
  const implementation = m.contract("Box");
  const initialize = m.encodeFunctionCall(implementation, "initialize", [
    10,
    m.getParameter("multisig", process.env.MULTISIG!),
  ]);
  const proxy = m.contract("BoxProxy", [implementation, initialize]);
  return { proxy };
});

export default BoxProxyModule;
