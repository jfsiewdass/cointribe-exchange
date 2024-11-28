import { IsArray, IsNumber, IsString, MinLength } from "class-validator";

export class StoreBetDto {
    @IsString()
    wallet: string;

    @IsArray()
    options: { 
        name: string; 
        multipliedBy: number,
        amount: number
    }[];

    @IsNumber()
    amount: number;

    @IsArray()
    result: Array<number>;

    @IsString()
    email: string | null;

    @IsString()
    userId: any;
}