import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { WalletContract, WalletContractSchema } from './schemas/wallet-contract.schema';
import { HashService } from 'src/user/hash.service';
import { AuthService } from 'src/auth/auth.service';
import { BullModule } from '@nestjs/bullmq';
import { default as QueueType} from './queue/types.queue';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }, 
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletContract.name, schema: WalletContractSchema },
    ]),
    BullModule.registerQueue({
      name: QueueType.WITHDRAW_REQUEST
    }),
    UserModule
  ],
  controllers: [WalletController],
  providers: [
    WalletService, 
    UserService,
    HashService,
    AuthService
  ],
})
export class WalletModule {}
