export interface IPin {
    username: string;
    lat: number;
    long: number;
    note: string;
    from: Date;
    to: Date;
}
export interface IPinData extends IPin {
    updatedAt: Date;
}
export interface IPinNew extends IPin {
    key: string;
}