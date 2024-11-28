import { HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "src/user/user.service";
import { StoreBetDto } from "./dto/store-bet.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Dice, DiceDocument } from "./schemas/dice.schema";
import { Model } from "mongoose";
import { TokenService } from "src/auth/token.service";
import { GenericResponse } from "src/common/interfaces/generic-response";

@Injectable()
export class DiceService {

    constructor(
        @InjectModel(Dice.name) private diceModel: Model<DiceDocument>,
    private readonly tokenService: TokenService) {}

    async placeBet(storeBet: StoreBetDto) {
        const user = await this.tokenService.getUserByEmail(storeBet.email);
        storeBet.userId = user._id
        const createBet = new this.diceModel(storeBet)

        await createBet.save();

        return GenericResponse(null, 'User created', HttpStatus.CREATED);
    }
}