import { DIDDocument, ResponseBody } from './types';
import fetch from 'node-fetch';

export async function resolveDID(did:string): Promise<ResponseBody> {
    return new Promise<ResponseBody>(async (resolve,reject)=>{
        let url = "http://localhost:8080/resolvedid/"+did;
        var response:ResponseBody | undefined;
        response=await fetch(url).then((res:any)=>{return res.json()});
        if(response===undefined){
            reject("error on get request");
        }
        else{
            resolve(<ResponseBody>response);
        }
    });
}