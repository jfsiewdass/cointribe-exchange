import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsLowercase,
    IsNumber,
    IsOptional,
    IsString
} from 'class-validator';

export class TransferDto {
    @IsString()
    @Transform((coin) => coin.value.toUpperCase())
    coin: string;

    @IsNumber()
    amount: number;

    @IsString()
    to: number;

    @IsString()
    from: number;

    @IsOptional()
    @IsString()
    @IsEmail()
    @IsLowercase()
    email: string;
}