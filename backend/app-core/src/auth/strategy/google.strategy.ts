import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
// import { Strategy } from 'passport-local';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    
    constructor() {
        const config = {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK,
            scope: ['email', 'profile'],
            passReqToCallback: true
        }
        // console.log(config);
        
        super(config);
    }

    async validate(request: Request, accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        const { name, emails, photos } = profile;
        const user = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            picture: photos[0].value,
            accessToken,
            refreshToken
        };

        // Here you can add additional logic to check if the user exists in your database
        // If not, create a new user or throw an exception

        done(null, user);
    }
}