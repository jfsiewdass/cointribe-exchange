// auth.controller.ts
import { Controller, Get, Request, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
      ) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin(@Request() req) {
    return req.user;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async callback(@Request() req, @Res() res) {
    const credentials = await this.authService.googleLogin(req.user);
    res.redirect(`${process.env.FRONT_ORIGIN }/auth/success?u=${credentials}`);
  }
}
