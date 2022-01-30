export interface IHttpError {
    message: string,
    additionalInfo: IErrorMessage[]
}

export interface IErrorMessage {
    name: string,
    error: string,
}

export interface IApiResponse {
    message: string;
    additonalInfo: IErrorMessage[];
}