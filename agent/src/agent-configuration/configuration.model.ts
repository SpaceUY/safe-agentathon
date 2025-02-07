import { AgentChecks, AgentInteractions } from './models';

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
