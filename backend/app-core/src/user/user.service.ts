import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { HashService } from './hash.service';
import { GenericExceptionResponse, GenericResponse } from 'src/common/interfaces/generic-response';
import { AuthDto } from 'src/auth/dto/auth-dto';
import { JwtService } from '@nestjs/jwt';
import { ExceptionEnum } from 'src/common/exceptions';
import { WalletService } from 'src/wallet/wallet.service';
import { QueryDto } from 'src/wallet/dto/query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private hashService: HashService,
    private readonly jwtService: JwtService,
    private walletService: WalletService
  ){}
  
  async getUserByEmail(email: string){
    return this.userModel.findOne({ email }).exec();
  }
  async register(createUserDto: CreateUserDto) {
    const createUser = new this.userModel(createUserDto);
    const user = await this.getUserByEmail(createUserDto.email);
      
    if (user) {
      throw new BadRequestException('No se puede registrar el usuario');
    }
    createUser.password = await this.hashService.hashPassword(createUserDto.password);
    return createUser.save();
  }

  async login(loginDto: LoginUserDto): Promise<GenericResponse<AuthDto>> {
    try {
      const user = await this.getUserByEmail(loginDto.email);

      if (!user) {
        throw new HttpException(ExceptionEnum.INVALID_EMAIL, HttpStatus.UNAUTHORIZED);
      }
      const isPasswordValid = await this.hashService.comparePassword(loginDto.password, user.password);
      
      if (!isPasswordValid) {
        throw new HttpException(ExceptionEnum.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
      }
      const queryDto: QueryDto = {coin: 'AVAX', walletId: null}
      const wallet = await this.walletService.getWallet(user.email, queryDto)
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
    catch(e: any) {
      return GenericExceptionResponse(e);
    }
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

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: any) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
