import { Injectable } from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { QueryDto } from './dto/query.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { HashService } from 'src/user/hash.service';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { WalletContract, WalletContractDocument } from './schemas/wallet-contract.schema';
import { WithdrawDto } from './dto/withdraw.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { default as QueueType} from './queue/types.queue';
import { Queue } from 'bullmq';
import { uuid } from 'uuidv4';
import { Transaction, TransactionDocument } from 'src/transaction/schemas/transaction.schema';
import { TransferDto } from './dto/transfer.dto';
import { GenericResponse } from 'src/common/interfaces/generic-response';
import { TxEnum } from 'src/common/enums/transaction-type.enum';
import { getWalletType, WalletType } from 'src/common/enums/wallet-type.enum';
import { StatusEnum } from 'src/common/enums/status.enum';
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletContract.name) private walletContractModel: Model<WalletContractDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectQueue(QueueType.WITHDRAW_REQUEST) private withdrawQueue: Queue,
  ){}
  async create(createWalletDto: CreateWalletDto) {
    let data = await this.userModel.aggregate([
      { $match: { email: createWalletDto.email } },
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
              $match: { 
                coin: createWalletDto.coin,
                chainId: createWalletDto.chainId
              }
            }
          ]
        }
      }
    ]).exec();
    let exists = true;
    if (data && data.length === 0)
      exists = false

    let wallet = exists ? data.find(w => w.walletsData.length > 0) : undefined;

    if (wallet) {
      wallet = wallet.walletsData[0];
      return  {
        address: wallet.address,
        balance: wallet.balance,
        chainId: wallet.chainId,
        coin: wallet.coin,
        walletId: wallet._id,
      }
    } else {
      let walletContract = await  this.walletContractModel.findOneAndUpdate(
        { chainId: createWalletDto.chainId, reserved: false },
        { reserved: true }
      );
      if (data) {
        const wallet = new this.walletModel({
          address: walletContract.address,
          chainId: createWalletDto.chainId,
          coin: createWalletDto.coin,
        });
        const saved = await wallet.save();
        if(saved) {
          const userUpdated = await this.userModel.updateOne({
            email: createWalletDto.email
          }, {
            $push: { wallets: wallet._id }
          })
          if (userUpdated) {
            return  {
              address: wallet.address,
              balance: wallet.balance,
              chainId: wallet.chainId,
              coin: wallet.coin,
              walletId: wallet._id,
            }
          }
        }
      }
      return 'This action adds a new wallet';
    }
  }

  async getWallet(email: string, queryDto: QueryDto) {
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
              $match: { coin: queryDto.coin }
            }
          ]
        }
      }
    ]).exec();
    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0)
      if (wallet) {
        wallet = wallet.walletsData[0];
        const data = await this.walletModel.findOne(
          {_id: new Types.ObjectId(wallet._id)},
          { _id: 0, transactions: 0, __v: 0 }
        ).exec()

        if (data) {
          return data;
        }
      }
    }
  }
  async getWallets(email:string) {
    let data = await this.userModel.aggregate([
      { $match: { email: email } },
      { $unwind: '$wallets' },
      { $project: { _id: 0, wallets: 1 } },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallets',
          foreignField: "_id",
          as: 'walletsData',
          pipeline: [
            { '$project': { transactions: 0 } }
          ]
        }
      }
    ]).exec();

    if (data && data.length > 0) {
      return data.map( wallet => {
        let walletsData = wallet.walletsData[0];
        return {
          balance: walletsData.balance,
          earn: walletsData.earn,
          game: walletsData.game,
          address: walletsData.address,
          chainId: walletsData.chainId,
          coin: walletsData.coin,
          walletId: walletsData._id,
        }
      })
    }
  }
  async withdraw(withdrawDto: WithdrawDto) {
    const data = await this.userModel.aggregate([
      { $match: { email: withdrawDto.email } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: "wallets",
          localField: "wallets",
          foreignField: "_id",
          as: "walletsData",
          pipeline: [
            {
              $match: { coin: withdrawDto.coin }
            }
          ]
        }
      }
    ]).exec();

    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0)
      if (wallet) {
        wallet = wallet.walletsData[0];
        const data = await this.walletModel.findOne(
          { _id: new Types.ObjectId(wallet._id) },
          { _id: 0, transactions: 0, __v: 0 }
        ).exec();

        if (data && data.balance >= withdrawDto.amount) {
          const transaction = new this.transactionModel({
            nature: 2,
            amount: -1 * withdrawDto.amount,
            created_at: Date.now(),
            status: 1,
            txHash: uuid(),
            to: withdrawDto.to
          });

          const saved = await transaction.save();

          if (saved) {
            const result = await this.walletModel.updateOne(
              { _id: new Types.ObjectId(wallet._id) },
              {
                $push: { transactions: transaction._id },
                $inc: { balance: transaction.amount }
              });

            if (result) {
              await this.withdrawQueue.add('request', {
                transactionId: transaction._id.toString(),
                walletId: wallet._id.toString(),
                amount: withdrawDto.amount,
                withdrawAddress: withdrawDto.to,
              });

              return {
                error: null,
                data: 'success id: '+wallet._id.toString()
              };
            }
          }
        } else {
          return {
            error: true,
            msg: 'Insuficient balance'
          };
        }

      }
    }
  }
  async transfer(transferDto: TransferDto) {

    const response: GenericResponse<any> = {
      status: 'STATUS',
      statusCode: 200,
      data: null,
      message: ''
    }
    const data = await this.userModel.aggregate([
      { $match: { email: transferDto.email } },
      { $unwind: '$wallets' },
      { $project: { _id: 0 } },
      {
        $lookup: {
          from: "wallets",
          localField: "wallets",
          foreignField: "_id",
          as: "walletsData",
          pipeline: [
            {
              $match: { coin: transferDto.coin }
            }
          ]
        }
      }
    ]).exec();
    console.log(data);

    if (data && data.length > 0) {
      let wallet = data.find(w => w.walletsData.length > 0)
      if (wallet) {
        wallet = wallet.walletsData[0];
        const data = await this.walletModel.findOne(
          { _id: new Types.ObjectId(wallet._id) },
          { _id: 0, transactions: 0, __v: 0 }
        ).exec();

        const updateAmount = {
          balance: data.balance,
          earn: data.earn,
          game: data.game,
        }

        if (transferDto.from == WalletType.SPOT && updateAmount.balance >= transferDto.amount) {
          updateAmount.balance = -1 * transferDto.amount;
        } else if (transferDto.from == WalletType.EARN && updateAmount.earn >= transferDto.amount) {
          updateAmount.earn = -1 * transferDto.amount
        } else if (transferDto.from == WalletType.GAME && updateAmount.game >= transferDto.amount) {
          updateAmount.game = -1 * transferDto.amount
        } else {
          response.message = 'Insuficient balance'
          response.statusCode = 500
          response.status = 'error'

          return response;
        }

        if (transferDto.to == WalletType.SPOT) updateAmount.balance = updateAmount.balance + transferDto.amount
        if (transferDto.to == WalletType.EARN) updateAmount.earn = updateAmount.earn + transferDto.amount
        if (transferDto.to == WalletType.GAME) updateAmount.game = updateAmount.game + transferDto.amount

        
        if (data) {
          const transaction = new this.transactionModel({
            nature: TxEnum.TRANSFER,
            amount: -1 * transferDto.amount,
            created_at: Date.now(),
            status: StatusEnum.PROCESSED,
            txHash: uuid(),
            from: getWalletType(transferDto.from),
            to: getWalletType(transferDto.to),
          });

          const saved = await transaction.save();

          if (saved) {
            
            
            const result = await this.walletModel.updateOne(
              { _id: new Types.ObjectId(wallet._id) },
              {
                $push: { transactions: transaction._id },
                $inc: updateAmount
              });

            if (result) {

              response.message = 'Transferencia existosa'
              response.statusCode = 200
              response.status = 'success'
              response.data = updateAmount
    
              return response
            }
          }
        } else {
          response.message = 'Transfer error'
          response.statusCode = 500
          response.status = 'error'

          return response
        }
      }
    }


   
    return response
  }
} 
