import { HttpException, HttpStatus } from "@nestjs/common";

export interface GenericResponse<Type> {
    status?: string,
    statusCode?: number,
    data: Type,
    message: string
}

export function GenericExceptionResponse<T>(exception: HttpException): GenericResponse<T> {
    return {
        status: exception?.getStatus() === 401 ? 'Unauthorized' : 'Error',
        statusCode: exception?.getStatus() ?? 500,
        data: null,
        message: exception?.message,
    };
}

export function GenericResponse<Type>(type: Type, message: string, status: HttpStatus = 200): GenericResponse<Type> {
    return {
        status: 'Success',
        statusCode: status,
        data: type,
        message: message,
    };
}