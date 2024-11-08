import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Headers } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { WithdrawDto } from './dto/withdraw.dto';
import { AuthGuard } from 'src/guard/auth/auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { AuthDto } from 'src/auth/dto/auth-dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly authService: AuthService
  ) {}

  //@UseGuards(AuthenticatedGuard)
  @UseGuards(AuthGuard)
  @Post('create')
  createWallet(@Request() req, @Body() createWalletDto: CreateWalletDto) {
    createWalletDto.email = req.user.email;
    return this.walletService.create(createWalletDto);
  }

  //@UseGuards(AuthenticatedGuard)
  @UseGuards(AuthGuard)
  @Get('info')
  wallet(@Query() queryDto: QueryDto, @Headers('Authorization') auth: string) {
    const user: any = this.authService.decode(auth);
    return this.walletService.getWallet(user.email, queryDto);
  }

  //@UseGuards(AuthenticatedGuard)
  @UseGuards(AuthGuard)
  @Get('all')
  wallets(@Request() req) {
    return this.walletService.getWallets(req.user.email);
  }

  //@UseGuards(AuthenticatedGuard)
  @UseGuards(AuthGuard)
  @Post('withdraw')
  withdraw(
    @Request() req,
    @Body() withdrawDto: WithdrawDto
  ) {
    withdrawDto.email = req.user.email;
    return this.walletService.withdraw(withdrawDto);
  }

  @UseGuards(AuthGuard)
  @Post('transfer')
  transfer(@Body() transferDto: TransferDto, @Headers('Authorization') auth: string) {
    const user: any = this.authService.decode(auth);
    transferDto.email = user.email
    return this.walletService.transfer(transferDto);
  }
}
