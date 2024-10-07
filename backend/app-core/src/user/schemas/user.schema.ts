import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { Wallet } from "src/wallet/schemas/wallet.schema";

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({
        required: true,
        unique: true
    })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({type: [{ type: Types.ObjectId, ref: 'Wallet'}]})
    wallets: [Wallet];
}


export const UserSchema = SchemaFactory.createForClass(User);