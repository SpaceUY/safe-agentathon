# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

#

<!-- BASE DEPLOY -->

npx hardhat ignition deploy ignition/modules/BoxProxy.ts --network base_testnet --strategy create2 --verify
npx hardhat ignition deploy ignition/modules/BoxV2.ts --network base_testnet --strategy create2 --verify

<!-- SEPOLIA DEPLOY -->

npx hardhat ignition deploy ignition/modules/BoxProxy.ts --network sepolia_testnet --strategy create2 --verify
npx hardhat ignition deploy ignition/modules/BoxV2.ts --network sepolia_testnet --strategy create2 --verify

npx hardhat test test/BoxUpgradeability.ts --network base_testnet
npx hardhat test test/BoxUpgradeability.ts --network sepolia_testnet

#

https://github.com/NomicFoundation/hardhat-ignition/issues/788

https://help.safe.global/en/articles/235770-proposers
