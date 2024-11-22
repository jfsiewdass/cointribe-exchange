import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  constructor(
    private userService: UserService,
    private hashService: HashService,
    private readonly jwtService: JwtService,
    private walletService: WalletService,
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

  async googleLogin(userDto: CreateUserDto) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const user = await this.userService.getUserByEmail(userDto.email);
      
      const payload = { email: userDto.email, firstName: userDto.firstName, lastName: userDto.lastName, wallet: user?.wallets[0], verified: true };
      if (!user) {
        userDto.loggedInByGoogle = true
        userDto.emailVerifiedAt = new Date();
        const createUser = new this.userModel(userDto);
        createUser.password = await this.hashService.hashPassword('12345678');
        if (!createUser.save({ session: session })) 
          throw new HttpException("User not created", HttpStatus.BAD_REQUEST);

        let walletContract = await  this.walletContractModel.findOneAndUpdate(
          { chainId: process.env.CHAIN_ID, reserved: false },
          { reserved: true },
          { session: session }
        )
  
        if (walletContract) {
          const wallet = new this.walletModel({
            address: walletContract.address,
            chainId: process.env.CHAIN_ID,
            coin: process.env.COIN,
          });
    
          const saved = await wallet.save({ session: session });
          if (!saved)
            throw new HttpException("Wallet not created", HttpStatus.BAD_REQUEST);
          
          // ASSIGN WALLET TO USER
          const userUpdated = await this.userModel.updateOne({
            email: userDto.email
          }, {
            $push: { wallets: wallet._id },
            
          }, { session: session })
          
          if (!userUpdated) 
            throw new HttpException("Wallet not asigned to user", HttpStatus.BAD_REQUEST);

          payload.wallet = wallet
        }
        
      } else {
        const queryDto: QueryDto = {coin: process.env.COIN, walletId: null}
        const wallet = await this.walletService.getWallet(user.email, queryDto)
        payload.wallet = wallet
      }
      const token = await this.jwtService.signAsync(payload);
      const AUTH: AuthDto = {
        token: token,
        email: userDto.email,
        wallet: payload.wallet
      }
      
      session.commitTransaction();
      return btoa(JSON.stringify(AUTH));
    } catch (error) {
      this.logger.error(error.toString());
      session.abortTransaction();
      return GenericExceptionResponse(error);
    } finally {
      session.endSession();
    }
  }
}