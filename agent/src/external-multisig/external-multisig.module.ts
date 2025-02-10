import { Module } from '@nestjs/common';
import { SafeMultisigService } from './safe-multisig.service';

@Module({
  imports: [],
  controllers: [],
  providers: [SafeMultisigService],
})
export class ExternalMultisigModule {}
