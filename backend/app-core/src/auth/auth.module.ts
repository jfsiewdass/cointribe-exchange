import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { UserModule } from "src/user/user.module";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategy/local.strategy";
import { SessionSerializer } from "./strategy/session.serialize";
import { HashService } from "src/user/hash.service";
import { UserService } from "src/user/user.service";
import { JwtModule } from "@nestjs/jwt";
import { Wallet, WalletSchema } from "src/wallet/schemas/wallet.schema";
import { GoogleStrategy } from "./strategy/google.strategy";
import { AuthController } from "./auth.controller";
import { WalletService } from "src/wallet/wallet.service";
import { WalletContract, WalletContractSchema } from "src/wallet/schemas/wallet-contract.schema";
import { TokenService } from "./token.service";
import { BullModule } from '@nestjs/bullmq';
import { default as QueueType} from '../wallet/queue/types.queue';
import { Transaction, TransactionSchema } from "src/transaction/schemas/transaction.schema";
@Module({
    imports: [
        UserModule,
        PassportModule.register({ defaultStrategy: 'google' }),
        JwtModule.register({
            global: true,
            secret: 'prueba',
            signOptions: { expiresIn: "1d" },
        }),
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
    controllers: [AuthController],
    providers: [
        AuthService,
        LocalStrategy,
        GoogleStrategy,
        SessionSerializer,
        HashService,
        WalletService,
        TokenService,
        UserService
    ]
})
export class AuthModule { }