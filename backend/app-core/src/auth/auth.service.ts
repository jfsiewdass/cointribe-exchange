import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { GenericExceptionResponse, GenericResponse } from 'src/common/interfaces/generic-response';
import { AuthDto } from 'src/auth/dto/auth-dto';
import { ExceptionEnum } from 'src/common/exceptions';
import { WalletService } from 'src/wallet/wallet.service';
import { QueryDto } from 'src/wallet/dto/query.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from 'src/wallet/schemas/wallet.schema';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { CreateWalletDto } from 'src/wallet/dto/create-wallet.dto';
import { WalletContract, WalletContractDocument } from 'src/wallet/schemas/wallet-contract.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private hashService: HashService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletContract.name) private walletContractModel: Model<WalletContractDocument>,
    @InjectConnection() private readonly connection: Connection
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.getUserByEmail(email);
    if (user) {
      const math = await this.hashService.comparePassword(password, user.password);
      // console.log('match');

      if (math) {
        const payload = { email: user.email, firstName: user.firstName, lastName: user.lastName, wallet: user.wallets[0] };
        const token = await this.jwtService.signAsync(payload);

        return {
          token: token,
          email: user.email,
        };
      }
    }

    return null;
  }

  
  async getWallet(email: string) {
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
  async createWallet(createWalletDto: CreateWalletDto) {
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
      console.log(walletContract);
      
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

  async googleLogin(userDto: CreateUserDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const user = await this.userService.getUserByEmail(userDto.email);
      
      if (!user) {
        userDto.password = ''
        userDto.loggedInByGoogle = true
        
        const userCreated = await this.userService.register(userDto)
        if (userCreated) {
          const walletCreated: CreateWalletDto = {
            email: userDto.email,
            chainId: 43113,
            coin: 'AVAX'
          }
          try {
            await this.createWallet(walletCreated)
          } catch (walletError) {
            throw new HttpException(ExceptionEnum.ERROR_DURING_WALLET_CREATION, HttpStatus.CREATED);
          }
          
        }
      }
      const wallet = await this.getWallet(userDto.email)
      const payload = { email: userDto.email, firstName: userDto.firstName, lastName: userDto.lastName, wallet: wallet };
      const token = await this.jwtService.signAsync(payload);
      const AUTH: AuthDto = {
        token: token,
        email: userDto.email,
        wallet: wallet
      }
      const response: GenericResponse<AuthDto> = {
        status: 'SUCCESS',
        statusCode: 200,
        data: AUTH,
        message: 'Logged success'
      }
      session.commitTransaction();
      session.endSession();
      
      return btoa(JSON.stringify(AUTH));
    } catch (error) {
      session.abortTransaction();
      session.endSession();
      return GenericExceptionResponse(error);
    } 
  }
}