import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/user/schemas/user.schema";
export interface Wallet {
    balance: number;
    address: string;
    coin: string;
    chainId: number;
    earn: number;
    game: number;
}
export interface IUser {
    email: string;
    firstName:string;
    lastName: string;
    wallet: Wallet;
    iat: number;
    exp: number;
  }
@Injectable()
export class TokenService {
    constructor(private readonly jwtService: JwtService,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }
    decode(auth: string): User {
        const jwt = auth.replace('Bearer ', '');
        return this.jwtService.decode(jwt, { json: true }) as User;
    }

    async getUserByEmail(email: string){
        return this.userModel.findOne({ email }).exec();
    }
}

