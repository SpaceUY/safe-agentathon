// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BoxModule = buildModule("BoxModule", (m) => {
  const box = m.contract("Box");
  return { box };
});

export default BoxModule;
