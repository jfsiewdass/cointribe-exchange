import { Controller } from "@nestjs/common";
import { TokenService } from "src/auth/token.service";
import { WalletService } from "src/wallet/wallet.service";

@Controller('wallet')
export class DiceController {
  constructor(
    private readonly walletService: WalletService,
    private readonly tokenService: TokenService
  ) {}


}