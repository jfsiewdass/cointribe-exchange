import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Wallet, WalletSchema } from '../wallet/schemas/wallet.schema';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { TokenService } from 'src/auth/token.service';
import { WalletService } from 'src/wallet/wallet.service';
import { WalletContract, WalletContractSchema } from 'src/wallet/schemas/wallet-contract.schema';
import { BullModule } from '@nestjs/bullmq';
import { default as QueueType} from '../wallet/queue/types.queue';
@Module({
  imports: [
    UserModule,
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
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TokenService,
    UserService,
    HashService,
    WalletService
  ]
})
export class TransactionModule {}
