import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { GenericResponse } from 'src/common/interfaces/generic-response';
import { AuthDto } from 'src/auth/dto/auth-dto';
import { ExceptionEnum } from 'src/common/exceptions';
import { WalletService } from 'src/wallet/wallet.service';
import { QueryDto } from 'src/wallet/dto/query.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Wallet, WalletDocument } from 'src/wallet/schemas/wallet.schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private hashService: HashService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) { }

  decode(auth: string): { uuid: string } {
    const jwt = auth.replace('Bearer ', '');
    return this.jwtService.decode(jwt, { json: true }) as { uuid: string };
  }

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

  async login(loginDto: LoginUserDto): Promise<GenericResponse<AuthDto>> {
    const user = await this.userService.getUserByEmail(loginDto.email);

    if (!user) {
      throw new HttpException(ExceptionEnum.INVALID_EMAIL, HttpStatus.UNAUTHORIZED);
    }
    const isPasswordValid = this.hashService.comparePassword(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new HttpException(ExceptionEnum.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
    }
    const wallet = await this.getWallet(user.email)
    const payload = { email: user.email, firstName: user.firstName, lastName: user.lastName, wallet: wallet };
    
    const token = await this.jwtService.signAsync(payload);
    const AUTH: AuthDto = {
      token: token,
      email: user.email,
      wallet: wallet
    }
    const response: GenericResponse<AuthDto> = {
      status: 'STATUS',
      statusCode: 200,
      data: AUTH,
      message: 'Logged success'
    }
    return response;
  }
  async logout(user: any) {
    const response: GenericResponse<boolean> = {
      status: 'STATUS',
      statusCode: 200,
      data: true,
      message: 'Logout success'
    }
    return response;
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
}