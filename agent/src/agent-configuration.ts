import * as rawAgentConfig from './agent-config.json';

export class AgentConfigurationService {
  private static getConfig = () => rawAgentConfig as Configuration;

  public static getAgentChecks(): AgentChecks[] {
    return [];
  }

  public static getTxsToOperate() {
    const operations = Object.keys(
      AgentConfigurationService.getConfig().txsToOperate,
    );
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
}

export interface Configuration {
  isPayer: boolean;
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
    twoFA: TwoFactor;
    holdToReplicate: boolean;
  };
}

interface TwoFactor {
  type: 'email' | 'phone';
  value: string;
}
