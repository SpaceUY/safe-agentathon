import { Module } from '@nestjs/common';
import {
  SafeMultisigService,
  MultisigTransaction,
} from './safe-multisig.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SafeMultisigService],
  exports: [SafeMultisigService],
})
export class ExternalMultisigModule {}
export { MultisigTransaction, SafeMultisigService };
