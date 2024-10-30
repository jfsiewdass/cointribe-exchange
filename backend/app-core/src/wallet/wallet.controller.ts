import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { WithdrawDto } from './dto/withdraw.dto';
import { AuthGuard } from 'src/guard/auth/auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

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
  wallet(@Request() req, @Query() queryDto: QueryDto) {
    return this.walletService.getWallet(req.user.email, queryDto);
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
}
