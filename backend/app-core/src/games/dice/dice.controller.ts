import { Body, Controller, Headers, Post } from "@nestjs/common";
import { TokenService, IUser } from "src/auth/token.service";
import { StoreBetDto } from "./dto/store-bet.dto";
import { DiceService } from "./dice.service";

@Controller('games/dice')
export class DiceController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly diceService: DiceService,
  ) {}

  @Post('bet')
  storeBet(@Body() storeBetDto: StoreBetDto, @Headers('Authorization') auth: string) {
      const user = this.tokenService.decode(auth);
      storeBetDto.email = user.email;
    return this.diceService.placeBet(storeBetDto);
  }
}