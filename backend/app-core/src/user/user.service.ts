import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Connection, Model } from 'mongoose';
import { HashService } from './hash.service';
import { GenericExceptionResponse, GenericResponse } from 'src/common/interfaces/generic-response';
import { AuthDto } from 'src/auth/dto/auth-dto';
import { JwtService } from '@nestjs/jwt';
import { ExceptionEnum } from 'src/common/exceptions';
import { WalletService } from 'src/wallet/wallet.service';
import { QueryDto } from 'src/wallet/dto/query.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { WalletContract, WalletContractDocument } from 'src/wallet/schemas/wallet-contract.schema';
import { Wallet, WalletDocument } from 'src/wallet/schemas/wallet.schema';
import { ForgotPasswordDto } from './dto/forgot-password.dto';


interface EmailData {
  email: string;
  name: string;
  link: string;
}
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name, { timestamp: true });
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(WalletContract.name) private walletContractModel: Model<WalletContractDocument>,
    private hashService: HashService,
    private readonly jwtService: JwtService,
    private walletService: WalletService,
    private readonly mailService: MailerService,
    @InjectConnection() private readonly connection: Connection
  ){}
  
  async getUserByEmail(email: string){
    return this.userModel.findOne({ email }).exec();
  }

  async register(createUserDto: CreateUserDto) {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const user = await this.getUserByEmail(createUserDto.email);
      if (user)
        throw new HttpException('Email exists', HttpStatus.BAD_REQUEST);

      const createUser = new this.userModel(createUserDto);

      createUser.password = await this.hashService.hashPassword(createUserDto.password);
      // SAVE USER
      if (!await createUser.save({ session: session }))
        throw new HttpException("User not created", HttpStatus.BAD_REQUEST);

      // GET AVALAIBLE WALLET
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
          email: createUserDto.email
        }, {
          $push: { wallets: wallet._id },
          
        }, { session: session })
  
        if (!userUpdated) 
          throw new HttpException("Wallet not asigned to user", HttpStatus.BAD_REQUEST);
      }

      const payload = { email: createUser.email }
      const token = await this.jwtService.signAsync(payload)

      const mailData: EmailData = {
        name: `${createUser.firstName} ${createUser.lastName}`,
        email: createUser.email,
        link: `${process.env.FRONT_ORIGIN}/auth/email-confirm?token=${token}`,
      }

      this.sendVerificationLink(mailData)

      await session.commitTransaction();
    } catch(e: any) {
      console.log(e);
      
      await session.abortTransaction();
      this.logger.error(e.toString());
      return GenericExceptionResponse(e);
    }finally {
      console.log('end session');
      
      await session.endSession();
    }
    return GenericResponse(null, 'User created', HttpStatus.CREATED);
  }

  async login(loginDto: LoginUserDto): Promise<GenericResponse<AuthDto>> {
    try {
      const user = await this.getUserByEmail(loginDto.email);

      if (!user) 
        throw new HttpException(ExceptionEnum.INVALID_EMAIL, HttpStatus.UNAUTHORIZED);
      
      if (user.loggedInByGoogle)
        throw new HttpException(ExceptionEnum.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);

      const isPasswordValid = await this.hashService.comparePassword(loginDto.password, user.password);
      
      if (!isPasswordValid) {
        throw new HttpException(ExceptionEnum.INVALID_PASSWORD, HttpStatus.UNAUTHORIZED);
      }
      const queryDto: QueryDto = {coin: process.env.COIN, walletId: null}
      const wallet = await this.walletService.getWallet(user.email, queryDto)
      const payload = { email: user.email, firstName: user.firstName, lastName: user.lastName, wallet: wallet };
      const token = await this.jwtService.signAsync(payload);
      const AUTH: AuthDto = { token: token, email: user.email, wallet: wallet }

      return GenericResponse(AUTH, 'Logged success', HttpStatus.OK);
    }
    catch(e: any) {
      this.logger.error(e.toString());
      return GenericExceptionResponse(e);
    }
  }
  async logout(user: any) {
    
    return GenericResponse(true, 'Logout success');
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
  async sendVerificationLink(mailData: EmailData): Promise<boolean> {
 
    try
    {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              .container { max-width: 600px; margin: auto; }
              h1 { color: #333; text-align: center; }
              a { 
                display: inline-block;
                background-color: #f8f9fa;
                color: #495057;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s ease;
              }
              a:hover { background-color: #e9ecef; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="path/to/your/logo.jpg" alt="Logo" style="max-width: 200px; display: block; margin: 20px auto;">
              <h1>Bienvenido al aplicativo</h1>
              <p>Para confirmar la dirección de correo electrónico, <a href="${mailData.link}" target="_blank" rel="noopener noreferrer">haga clic aquí</a>.</p>
            </div>
          </body>
        </html>
      `;
 
      await this.mailService.sendMail({
        to: mailData.email,
        subject: mailData.name,
        html: htmlContent,
      });

      return true;

    } catch(e) {
      throw new HttpException("Email not send", HttpStatus.BAD_REQUEST);
    }
  }
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {

  }

  async confirmEmail(token: string) {
    try {
      this.jwtService.verify(token);
    } catch (_) {
      return GenericExceptionResponse(new HttpException("Expired or invalid token", HttpStatus.FORBIDDEN));
    }

    try {
      const { email } = this.jwtService.decode(token, { json: true });
      if (email) {
        const user = await this.getUserByEmail(email);
        if (!user)
          throw new HttpException('Email does not exists', HttpStatus.NOT_FOUND);

        if (user.emailVerifiedAt) 
          return GenericResponse(true, 'User email verified', HttpStatus.OK);
          
          user.emailVerifiedAt = new Date();
          if (await user.save())
            return GenericResponse(true, 'User email verified', HttpStatus.OK);
      }
        
      
      throw new HttpException('Email does not exists', HttpStatus.BAD_REQUEST);
    } catch (e) {
      this.logger.error(e.toString());
      return GenericExceptionResponse(e);
    }
  }
}
