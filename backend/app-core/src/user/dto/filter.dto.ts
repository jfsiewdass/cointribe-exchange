import { Transform } from 'class-transformer';
import {
    IsMongoId,
    IsOptional,
    IsString
} from 'class-validator';

export class FilterDto {
    @IsOptional()
    @IsString()
    email: string;

    @IsOptional()
    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    wallet: string;

    @IsOptional()
    @IsString()
    page: string;

    @IsOptional()
    @IsString()
    limit: string;
}