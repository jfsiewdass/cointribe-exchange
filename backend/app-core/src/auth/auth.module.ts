import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { User, UserSchema } from "src/user/schemas/user.schema";
import { UserModule } from "src/user/user.module";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./strategy/local.strategy";
import { SessionSerializer } from "./strategy/session.serialize";
import { HashService } from "src/user/hash.service";
import { UserService } from "src/user/user.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [
        UserModule,
        //PassportModule.register({ session: true }),
        JwtModule.register({
            global: true,
            secret: 'prueba',
            signOptions: { expiresIn: "1d" },
        }),
        MongooseModule.forFeature([{
            name: User.name,
            schema: UserSchema
        }])
    ],
    providers: [
        AuthService,
        LocalStrategy,
        SessionSerializer,
        HashService,
        UserService
    ]
})
export class AuthModule { }