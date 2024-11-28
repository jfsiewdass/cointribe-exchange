import { Module } from '@nestjs/common';
import { DiceController } from './dice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';
import { WalletService } from 'src/wallet/wallet.service';
import { UserService } from 'src/user/user.service';
import { TokenService } from 'src/auth/token.service';
import { Dice, DiceSchema } from './schemas/dice.schema';
import { DiceService } from './dice.service';
@Module({
    imports: [
        MongooseModule.forFeature([
        { name: User.name, schema: UserSchema }, 
        { name: Dice.name, schema: DiceSchema },
      ]),
    ],
    controllers: [DiceController],
    providers: [
        TokenService,
        DiceService,
    ],
})
export class DiceModule {}
