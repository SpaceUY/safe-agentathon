// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BoxV2Module = buildModule("BoxV2Module", (m) => {
  const box = m.contract("BoxV2");
  return { box };
});

export default BoxV2Module;
