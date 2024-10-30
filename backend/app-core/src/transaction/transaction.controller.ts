import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { QueryDto } from './dto/query.dto';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { AuthGuard } from 'src/guard/auth/auth.guard';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  //@UseGuards(AuthenticatedGuard)
@UseGuards(AuthGuard)
  @Get('all')
  transactions(
    @Request() req,
    @Query() queryDto: QueryDto) {
    return this.transactionService.getTransactions(
      req.user.email,
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
