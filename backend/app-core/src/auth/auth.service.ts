import { UserService } from '../user/user.service';
import { HashService } from '../user/hash.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/user/dto/login-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private hashService: HashService,
        private readonly jwtService: JwtService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userService.getUserByEmail(email);
        if (user) {
            const math = await this.hashService.comparePassword(password, user.password);
            console.log('match');
            
            if (math){
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

    async login(loginDto: LoginUserDto){
        const user = await this.userService.getUserByEmail(loginDto.email);
    
        if (!user) {
          throw new UnauthorizedException("Invalid email");
        }
        const isPasswordValid =  this.hashService.comparePassword(loginDto.password, user.password);
    
        if (!isPasswordValid) {
          throw new UnauthorizedException("Invalid password");
        }
    
        const payload = { email: user.email, firstName: user.firstName, lastName: user.lastName, wallet: user.wallets[0] };
    
        const token = await this.jwtService.signAsync(payload);
    
        return {
          token: token,
          email: user.email,
        };
      }

      async verify(token: string) {
        return await this.jwtService.verifyAsync(token, {
          secret: 'prueba',
        });
      }
}