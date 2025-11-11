//https://docs.safe.global/advanced/smart-account-supported-networks

export type Safe4337CustomContractConfig = {
  safe4337ModuleAddress?: string;
  safeModulesSetupAddress?: string;
  safeModulesVersion?: string;
};

const SAFE_4337_CUSTOM_CONTRACTS_BY_CHAIN: Record<
  string,
  Safe4337CustomContractConfig[]
> = {
  '80002': [
    {
      safe4337ModuleAddress: '0x75cf11467937ce3f2f357ce24ffc3dbf8fd5c226',
      safeModulesSetupAddress: '0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47',
      safeModulesVersion: '0.3.0',
    },
    {
      safe4337ModuleAddress: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
      safeModulesSetupAddress: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
      safeModulesVersion: '0.2.0',
    },
  ],
  '11155111': [
    {
        safe4337ModuleAddress: '0x75cf11467937ce3f2f357ce24ffc3dbf8fd5c226',
        safeModulesSetupAddress: '0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47',
        safeModulesVersion: '0.3.0',
      },
      {
        safe4337ModuleAddress: '0xa581c4A4DB7175302464fF3C06380BC3270b4037',
        safeModulesSetupAddress: '0x8EcD4ec46D4D2a6B64fE960B3D64e8B94B2234eb',
        safeModulesVersion: '0.2.0',
      },
  ],
};

export function getSafe4337CustomContracts(
  chainId: string,
  preferredVersion?: string
): Safe4337CustomContractConfig | undefined {
  const configs = SAFE_4337_CUSTOM_CONTRACTS_BY_CHAIN[chainId];
  if (!configs) {
    return undefined;
  }

  if (preferredVersion) {
    const matchingConfig = configs.find(
      (config) => config.safeModulesVersion === preferredVersion
    );
    if (matchingConfig) {
      return matchingConfig;
    }
  }

  return configs[0];
}