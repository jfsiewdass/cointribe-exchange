import { Module } from '@nestjs/common';
import { DiceController } from './dice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import { WalletService } from 'src/wallet/wallet.service';
import { UserService } from 'src/user/user.service';
import { TokenService } from 'src/auth/token.service';
@Module({
    imports: [
        MongooseModule.forFeature([
        { name: User.name, schema: UserSchema }, 
        { name: Wallet.name, schema: WalletSchema },
      ])
    ],
    controllers: [DiceController],
    providers: [
        WalletService, 
        UserService,
        TokenService
      ],
})
export class DiceModule {}
