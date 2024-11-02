import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { HashService } from './hash.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { AuthService } from 'src/auth/auth.service';
import { Wallet, WalletSchema } from 'src/wallet/schemas/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }, 
      { name: Wallet.name, schema: WalletSchema },
  ])
  ],
  controllers: [UserController],
  providers: [
    UserService,
    HashService,
    AuthService
  ],
})
export class UserModule {}
