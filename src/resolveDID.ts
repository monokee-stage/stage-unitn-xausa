import { DIDDocument, ResponseBody } from './types';
import fetch from 'node-fetch';

export async function resolveDID(did:string): Promise<DIDDocument> {
    try {
        return new Promise<DIDDocument>(async (resolve,reject)=>{
            let url = "http://localhost:8080/resolvedid/"+did;
            let response= await wrapFetch(url).catch(()=>{reject()});
            let doc:DIDDocument=(<ResponseBody>response).didDocument

            resolve(doc);
        });
    } catch (error) {
        console.log(`Error occurred in resolveDID function ${error}`); //logger could be better
        throw error;
    }
}

export async function wrapFetch(url:string):Promise<ResponseBody>{
    return new Promise<ResponseBody>(async (resolve,reject)=>{
        var sup:ResponseBody | undefined;
        var response: ResponseBody;
        sup=await fetch(url).then((res:any)=>{return res.json()});
        if(sup===undefined){
            reject("error on get request");
        }
        else{
            response=<ResponseBody>sup;
            resolve(response);
        }
        
    });
}