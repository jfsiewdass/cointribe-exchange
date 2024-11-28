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


    return GenericResponse(data, '');
  }

  async getTransactions(email: string, queryDto: QueryDto) {
    // const { page, limit } = queryDto
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
        const page = parseInt(queryDto.page.toString()) || 1;
        const limit = parseInt(queryDto.limit.toString()) || 10;

        const data = await this.walletModel.aggregate([
          { $match: { _id: new Types.ObjectId(wallet._id) } },
          {
            $lookup: {
              from: "transactions",
              localField: "transactions",
              foreignField: "_id",
              as: "transactionData"
            }
          }])
          .project({
            _id: 0,
            transactionData: {
              $slice: [
                "$transactionData",
                (page - 1) * limit,
                limit
              ]
            }
          }).sort({ 'transactionData.createdAt': -1 }).exec();
        
        if (data && data.length > 0) {
          
          const transactions = data[0].transactionData.map(tx => {
            console.log(tx);
            
            return  {
              typeId: tx.nature,
              type: TxEnum[tx.nature],
              currency: 'USDT',
              txHash: tx.txHash,
              transactionId: tx._id,
              created_at: tx.created_at,
              confirmations: tx.confirmations,
              statusId: tx.status,
              status: StatusEnum[tx.status],
              amount: tx.amount
            }
          }).sort((a, b) => {
            // Convertir las fechas a objetos Date para una comparación precisa
            const dateA = new Date(a.created_at || '1970-01-01T00:00:00Z');
            const dateB = new Date(b.created_at || '1970-01-01T00:00:00Z');
          
            // Ordenar de forma ascendente (más antiguo a más reciente)
            return Number(dateA) - Number(dateB);
          })
          
          return GenericResponse(transactions, 'transactions');
        }
        
      }
     
    }
    return GenericResponse([], 'transactions');
  }
}
