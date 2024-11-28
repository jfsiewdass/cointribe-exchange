import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Headers, Req, Res, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from 'src/guard/auth/local-auth.guard';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
import { AuthGuard as Auth } from 'src/guard/auth/auth.guard';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { TokenService } from 'src/auth/token.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { FilterDto } from './dto/filter.dto';
// import { UpdateUserDto } from './dto/login-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }
  //@UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }
  //@UseGuards(AuthenticatedGuard)
  @UseGuards(Auth)
  @Get('info')
  getUsers(@Request() req) {
    return {
      data: req.user
    };
  }
  //@UseGuards(AuthenticatedGuard)
  @UseGuards(Auth)
  @Delete('logout')
  logout(@Headers('Authorization') auth: string) {
    const user = this.tokenService.decode(auth);
    return this.userService.logout(user);
  }
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.userService.forgotPassword(forgotPasswordDto);
  }
  @Get('confirm-email')
  confirmEmail(@Query('token') token: string) {
    return this.userService.confirmEmail(token);
  }

  @Get('all')
  getAll(@Query() params: FilterDto) {
    return this.userService.findAll(params);
  }

}
