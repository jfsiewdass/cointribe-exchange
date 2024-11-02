export interface GenericResponse<Type>{
    status?:string,
    statusCode?:number,
    data:Type,
    message:string
}