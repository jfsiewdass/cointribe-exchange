import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    UserModule
  ],
  controllers: [WalletController],
  providers: [
    WalletService, 
    UserService
  ],
})
export class WalletModule {}
