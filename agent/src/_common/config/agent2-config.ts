export default {
  id: 'AGENT2',
  isMultisigExecutor: false,
  autonomousProposalListener: true,
  totp: 'EVMEKJB6LVKDUSC2ORYUGXTCIZETCTS5GZYSGRS5PU5GY3DCENSA',
  notificationTo: { type: 'email', value: 'rpintos@spacedev.uy' },
  multisigs: [
    {
      chainId: '84532',
      address: '0x6fB0A20D6DefF6d6be127Fa86B754Ff12249631C',
      rpcUrl: 'https://84532.rpc.thirdweb.com',
    },
    {
      chainId: '11155111',
      address: '0x6fB0A20D6DefF6d6be127Fa86B754Ff12249631C',
      rpcUrl: 'https://11155111.rpc.thirdweb.com',
    },
  ],
  txsToOperate: {
    upgradeToAndCall: {
      checks: ['upgrade-verification', 'upgrade-to-same-version-across-chains'],
      chainIds: ['84532', '11155111'],
      twoFARequired: true,
      holdToCheck: true,
      holdToReplicate: true,
    },
    '[NATIVE_TRANSFER]': {
      chainIds: ['84532', '11155111'],
      twoFARequired: true,
      holdToCheck: true,
      holdToReplicate: true,
    },
  },
  interactions: [
    'get-signer-address',
    'get-operation-status',
    'get-operation-details',
  ],
};
