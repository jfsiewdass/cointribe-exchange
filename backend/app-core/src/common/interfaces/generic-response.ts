import { HttpException, HttpStatus } from "@nestjs/common";

export interface GenericResponse<Type> {
    status?: string,
    statusCode?: number,
    data: Type,
    message: string
}

export function GenericExceptionResponse<T>(exception: HttpException | any): GenericResponse<T> {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (exception instanceof HttpException) {
        statusCode = exception.getStatus();
        message = exception.message;

    } else if (exception instanceof Error) {
        statusCode = 500;
        message = exception.message;
    }

  return {
    status: statusCode === 401 ? 'Unauthorized' : 'Error',
    statusCode,
    data: null,
    message,
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