import fs from 'fs';

export interface IResponseData {
    headers: any;
    code: number;
    data: any;
    stream: fs.ReadStream | null
}
