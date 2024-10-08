import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LocalAuthGuard } from 'src/guard/auth/local-auth.guard';
import { AuthenticatedGuard } from 'src/guard/auth/authenticated.guard';
// import { UpdateUserDto } from './dto/login-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto);
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return {
      msj: 'Logged in'
    };
  }
  @UseGuards(AuthenticatedGuard)
  @Get('info')
  getUsers(@Request() req) {
    return {
      data: req.user
    };
  }
  @UseGuards(AuthenticatedGuard)
  @Post('logout')
  logout(@Request() req) {
    req.logout(() => {
      return;
    })
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
