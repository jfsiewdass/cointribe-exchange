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

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletContract.name) private walletContractModel: Model<WalletContractDocument>,
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
          address: walletsData.address,
          chainId: walletsData.chainId,
          coin: walletsData.coin,
          walletId: walletsData._id,
        }
      })
    }
  }
  async withdraw(withdrawDto: WithdrawDto) {
    const withdrawRequest = await this.withdrawQueue.add('request', {
      transactionId: 'test_id: transaction',
      walletId: 'wallet_id: wallet',
      amount: withdrawDto.amount,
      withdrawAddress: withdrawDto.to,
    })
    return withdrawRequest.asJSON()
  }
}
