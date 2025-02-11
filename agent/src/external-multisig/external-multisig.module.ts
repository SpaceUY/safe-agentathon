import { Module } from '@nestjs/common';
import {
  SafeMultisigService,
  MultisigTransaction,
} from './safe-multisig.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SafeMultisigService],
})
export class ExternalMultisigModule {}
export { SafeMultisigService, MultisigTransaction };
