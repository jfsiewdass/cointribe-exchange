import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Wallet } from "src/wallet/schemas/wallet.schema";

export type DiceDocument = Dice & Document;
export interface Option {
    name: string;
    multipliedBy: number;
}

@Schema()
export class Dice {
    @Prop({ type: [{ name: String, multipliedBy: Number }] })
    options: Option[];

    @Prop()
    amount: number;

    @Prop({ type: [Number] })
    result: number[];

    @Prop()
    wallet: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;
}


export const DiceSchema = SchemaFactory.createForClass(Dice);