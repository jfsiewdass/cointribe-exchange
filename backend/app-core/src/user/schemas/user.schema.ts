import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import paginate from 'mongoose-paginate-v2';
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

    @Prop({ default: 1 })
    rol: number;


    @Prop({type: [{ type: Types.ObjectId, ref: 'Wallet'}]})
    wallets: [Wallet];

    @Prop({default: false})
    loggedInByGoogle: boolean

    @Prop({default: null})
    emailVerifiedAt: Date | null;

    @Prop({ default: 1 })
    status: number;
}
export const UserSchema = SchemaFactory.createForClass(User);

export const applyPaginatePluginHook: any = async (schema) => {
    await new Promise((resolve) => {
        schema.plugin(paginate, () => {
            console.log('Plugin applied');
            resolve(true);
        });
    });
};

  



