import { HttpException } from "@nestjs/common";

export interface GenericResponse<Type> {
    status?: string,
    statusCode?: number,
    data: Type,
    message: string
}

export function GenericExceptionResponse<T>(exception: HttpException): GenericResponse<T> {
    return {
        status: exception.getStatus() === 401 ? 'Unauthorized' : 'Error',
        statusCode: exception.getStatus(),
        data: null,
        message: exception.message,
    };
}