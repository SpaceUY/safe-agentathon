import * as rawAgentConfig from './agent-config.json';

export class AgentConfiguration {
  private static getConfig = () => rawAgentConfig as Configuration;

  public static isProposalListener(): boolean {
    return this.getConfig().autonomousProposalListener;
  }

  public static getAgentChecks(): AgentChecks[] {
    const checks: AgentChecks[] = [];
    const operations = Object.keys(AgentConfiguration.getConfig().txsToOperate);
    operations.forEach((op) => {
      checks.push(...AgentConfiguration.getConfig().txsToOperate[op].checks);
    });
    return checks;
  }

  public static getAgentInteractions(): AgentInteractions[] {
    const interactions: AgentInteractions[] =
      AgentConfiguration.getConfig().interactions || [];

    const operations = Object.keys(AgentConfiguration.getConfig().txsToOperate);
    operations.forEach((op) => {
      if (AgentConfiguration.getConfig().txsToOperate[op].twoFA) {
        interactions.push(AgentInteractions.PUSH_TWO_FACTOR);
        return;
      }
    });

    return interactions;
  }

  public static getTxsToOperate(): string[] {
    const operations = Object.keys(AgentConfiguration.getConfig().txsToOperate);
    return operations;
  }

  public static getMultisigs(): Multisig[] {
    return AgentConfiguration.getConfig().multiSigs;
  }
}

export enum AgentChecks {
  UPGRADE_VERIFICATION = 'upgrade-verification',
  UPGRADE_TO_SAME_VERSION_ACROSS_CHAINS = 'upgrade-to-same-version-across-chains',
}

export enum AgentInteractions {
  GET_SIGNER_ADDRESS = 'get-signer-address',
  GET_OPERATION_STATUS = 'get-operation-status',
  GET_OPERATION_DETAILS = 'get-operation-details',
  PUSH_TWO_FACTOR = 'push-two-factor',
}

export interface Configuration {
  isPayer: boolean;
  autonomousProposalListener: boolean;
  rejectTxIfNotRegistered: boolean;
  multiSigs: Multisig[];
  txsToOperate: TxsToOperate;
  interactions: AgentInteractions[];
}

interface Multisig {
  chainId: string;
  address: string;
  rpcUrl: string;
}

interface TxsToOperate {
  [key: string]: {
    checks: AgentChecks[];
    chainIds: string[];
    twoFA: TwoFactor | undefined;
    holdToReplicate: boolean;
  };
}

interface TwoFactor {
  type: 'email' | 'phone';
  value: string;
}
