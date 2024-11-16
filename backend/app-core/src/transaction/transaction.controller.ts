import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Headers } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { AuthGuard } from 'src/guard/auth/auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { TokenService } from 'src/auth/token.service';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly tokenService: TokenService
  ) {}

  //@UseGuards(AuthenticatedGuard)
@UseGuards(AuthGuard)
  @Get('all')
  transactions(@Query() queryDto: QueryDto, @Headers('Authorization') auth: string) {
      const user: any = this.tokenService.decode(auth);
    return this.transactionService.getTransactions(
      user.email,
      queryDto
    );
  }

  //@UseGuards(AuthenticatedGuard)
@UseGuards(AuthGuard)
  @Get('info')
  transaction(@Query() queryDto: QueryDto) {
    return this.transactionService.getTransaction(
      queryDto
    );
  }
}
