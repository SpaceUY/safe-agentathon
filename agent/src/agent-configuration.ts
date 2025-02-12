import { env } from './_common/config/config';
const rawAgentConfig = require('./_common/config/' + env.CONFIG_FILE + '.js');

export class AgentConfiguration {
  private static getConfig = () => {
    return rawAgentConfig.default as Configuration;
  };

  public static getAgentId(): string {
    return AgentConfiguration.getConfig().id;
  }

  public static isProposalListener(): boolean {
    return this.getConfig().autonomousProposalListener;
  }

  public static getAgentNotificationTo(): NotificationTo | undefined {
    return AgentConfiguration.getConfig().notificationTo;
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
      if (AgentConfiguration.getConfig().txsToOperate[op].twoFARequired) {
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

  public static getTxToOperate(key: string): TxToOperate {
    return AgentConfiguration.getConfig().txsToOperate[key];
  }

  public static holdToCheck(key: string): boolean {
    return AgentConfiguration.getTxToOperate(key).holdToCheck;
  }

  public static isMultisigExecutor(): boolean {
    return AgentConfiguration.getConfig().isMultisigExecutor;
  }

  public static holdToReplicate(key: string): boolean {
    return AgentConfiguration.getTxToOperate(key).holdToReplicate;
  }

  public static getMultisigs(): Multisig[] {
    return AgentConfiguration.getConfig().multisigs;
  }

  public static getTotp(): string {
    return this.getConfig().totp;
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
  id: string;
  notificationTo: NotificationTo | undefined;
  isMultisigExecutor: boolean;
  autonomousProposalListener: boolean;
  totp: string;
  multisigs: Multisig[];
  txsToOperate: TxsToOperate;
  interactions: AgentInteractions[];
}

interface NotificationTo {
  type: 'email';
  value: string;
}

export interface Multisig {
  chainId: string;
  address: string;
  rpcUrl: string;
}

interface TxsToOperate {
  [key: string]: TxToOperate;
}

export interface TxToOperate {
  checks: AgentChecks[];
  chainIds: string[];
  twoFARequired: boolean;
  holdToCheck: boolean;
  holdToReplicate: boolean;
}
