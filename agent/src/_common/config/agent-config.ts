export default {
  /* Unique identifier for the agent */
  id: 'AGENT',

  /*
    Determines the agent's role in transaction execution:
    - true: The agent will both approve transactions off-chain and execute them on-chain.
    - false: The agent will only perform off-chain approval without executing transactions.
  */
  isMultisigExecutor: true,

  /*
    Determines how the agent listens for proposals:
    - true: The agent actively listens for new proposals.
    - false: The agent operates under supervision and waits for manual execution (feature not fully developed).
  */
  autonomousProposalListener: true,

  /*
    Time-based one-time password (TOTP) secret for two-factor authentication (2FA).
    This value can be loaded into an authenticator app (e.g., Google Authenticator) to generate verification codes.
  */
  totp: 'EVMEKJB6LVKDUSC2ORYUGXTCIZETCTS5GZYSGRS5PU5GY3DCENSA',

  /*
    Notification settings for the agent:
    - The agent will send notifications (e.g., 2FA requests) to this email address.
    - Supported types: 'email' (phone support is a work in progress).
  */
  notificationTo: { type: 'email', value: 'rpintos@spacedev.uy' },

  /*
    List of multisig wallets that the agent will operate.
    These multisigs must be manually configured in Safe before use.
  */
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

  /*
    Configuration for the smart contract operations the agent will monitor and execute.
    Each entry corresponds to a function in a smart contract.
  */
  txsToOperate: {
    upgradeToAndCall: {
      /*
        Validation checks the agent will perform before executing this operation:
        - 'upgrade-verification': Ensures the upgrade process is valid.
        - 'upgrade-to-same-version-across-chains': Verifies that the upgrade version is consistent across all chains.
      */
      checks: ['upgrade-verification', 'upgrade-to-same-version-across-chains'],

      /* List of blockchain networks where this operation will be executed */
      chainIds: ['84532', '11155111'],

      /*
        Determines whether two-factor authentication (2FA) is required:
        - true: The agent will require 2FA confirmation before executing this transaction.
        - false: The agent will execute the transaction without 2FA.
      */
      twoFARequired: true,

      /*
        Synchronization setting for proposal verification across multiple chains:
        - true: The agent will wait until the operation is proposed on all listed chainIds before performing checks.
        - false: The agent will verify each proposal independently, regardless of proposals on other chains.
      */
      holdToCheck: true,

      /*
        Synchronization setting for transaction execution across multiple chains (applies only if isMultisigExecutor is true):
        - true: The agent will wait until the operation is confirmed and ready for execution on all specified chains before proceeding.
        - false: The agent will execute the operation on each chain independently, regardless of its confirmation status on other chains.
      */
      holdToReplicate: true,
    },
    '[NATIVE_TRANSFER]': {
      chainIds: ['84532', '11155111'],
      twoFARequired: true,
      holdToCheck: true,
      holdToReplicate: true,
    },
  },

  /*
    Limits the agent's exposed API interactions to those explicitly listed.
    Available interactions:
    - 'get-signer-address': Retrieves the agent's signing address.
    - 'get-operation-status': Fetches the status of an operation (feature not fully developed).
    - 'get-operation-details': Retrieves details of a specific operation (feature not fully developed).
  */
  interactions: [
    'get-signer-address',
    'get-operation-status',
    'get-operation-details',
  ],
};
