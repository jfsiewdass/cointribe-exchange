import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "src/user/user.service";
import { StoreBetDto } from "./dto/store-bet.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Dice, DiceDocument } from "./schemas/dice.schema";
import { Model } from "mongoose";
import { TokenService } from "src/auth/token.service";
import { GenericExceptionResponse, GenericResponse } from "src/common/interfaces/generic-response";

@Injectable()
export class DiceService {

    constructor(
        @InjectModel(Dice.name) private diceModel: Model<DiceDocument>,
    private readonly tokenService: TokenService) {}

    async placeBet(bet: any) {
        try {
            if (bet?.bet == null  || bet?.bet == '') 
                throw new HttpException("Bet not place", HttpStatus.NOT_FOUND)
            
            const storeBet: StoreBetDto = JSON.parse(atob(bet.bet))
            const user = await this.tokenService.getUserByEmail(bet.email);
            storeBet.userId = user._id
            const createBet = new this.diceModel(storeBet)
            await createBet.save();
    
        } catch (e) {
            return GenericExceptionResponse(e);
        }
       
        return GenericResponse(null, 'Bet created', HttpStatus.CREATED);
    }
}