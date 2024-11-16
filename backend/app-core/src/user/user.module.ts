import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HashService } from './hash.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import { TokenService } from 'src/auth/token.service';
import { WalletService } from 'src/wallet/wallet.service';
import { WalletContract, WalletContractSchema } from 'src/wallet/schemas/wallet-contract.schema';
import { Transaction, TransactionSchema } from 'src/transaction/schemas/transaction.schema';
// import { WalletModule } from 'src/wallet/wallet.module';
import { BullModule } from '@nestjs/bullmq';
import { default as QueueType} from '../wallet/queue/types.queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }, 
      { name: Wallet.name, schema: WalletSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: WalletContract.name, schema: WalletContractSchema },
    ]),
    BullModule.registerQueue({
      name: QueueType.WITHDRAW_REQUEST
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    HashService,
    TokenService,
    WalletService
  ],
})
export class UserModule {}
