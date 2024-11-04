import { Injectable } from '@nestjs/common';
import { User, UserDocument } from '../user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { QueryDto } from './dto/query.dto';
import { GenericResponse } from 'src/common/interfaces/generic-response';
import { StatusEnum } from 'src/common/enums/status.enum';
import { TxEnum } from 'src/common/enums/transaction-type.enum';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>
  ) { }

  async getTransaction(queryDto: QueryDto) {
    const data = await this.transactionModel.findOne(
      { _id: new Types.ObjectId(queryDto.transactionId) },
      { _id: 0, __v: 0 }
    ).exec();

    if (data) {
      return data;
    }
  }

  async getTransactions(email: string, queryDto: QueryDto) {
    const data = await this.userModel.aggregate([
      { $match: { email } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallets',
          foreignField: "_id",
          as: 'walletsData',
          pipeline: [
            {
              $match: { coin: 'AVAX' }
            }
          ]
        }
      }
    ]).exec();
    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0);
      if (wallet) {
        wallet = wallet.walletsData[0];
        const data = await this.walletModel.aggregate([
          { $match: { _id: new Types.ObjectId(wallet._id) } },
          { $unwind: '$transactions' },
          { $project: { _id: 0, transactions: 1 } },
          {
            $lookup: {
              from: "transactions",
              localField: "transactions",
              foreignField: "_id",
              as: "transactionData"
            }
          }
        ]).exec();

        if (data && data.length > 0) {
          const transactions = data.map(transaction => {
            return {
              typeId: transaction.transactionData[0].nature,
              type: TxEnum[transaction.transactionData[0].nature],
              currency: 'USDT',
              txHash: transaction.transactionData[0].txHash,
              transactionId: transaction.transactionData[0]._id,
              created_at: transaction.transactionData[0].created_at,
              confirmations: transaction.transactionData[0].confirmations,
              statusId: transaction.transactionData[0].status,
              status: StatusEnum[transaction.transactionData[0].status],
              amount: transaction.transactionData[0].amount
            }
          })
          const response: GenericResponse<any> = {
            status: 'STATUS',
            statusCode: 200,
            data: transactions,
            message: 'Logged success'
          }
          return response;
        }
      }
    }
  }
}
