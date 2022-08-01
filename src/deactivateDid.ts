import * as ed from '@noble/ed25519';
import * as bs58 from 'bs58';
import fetch from 'node-fetch'

export async function deactivateDID(did:string,privatekey:string):Promise<boolean>{
    return new Promise<boolean>(async (resolve,reject)=>{
        let signature=await ed.sign(Buffer.from("deactivate"),bs58.decode(privatekey)).catch(()=>reject("an error occured while signing the message body"));

        if(signature instanceof Uint8Array){
            let encodedSignature=bs58.encode(<Uint8Array>signature);

            let url="http://localhost:8080/deactivate/"+did;
            //perform the put fetch request and check the result
            let response:any = await fetch(url,{
                method: 'delete',
                body: JSON.stringify({signature:encodedSignature}),
                headers: {'Content-Type': 'application/json'}
            }).then((res:any)=>{return res.json()}).catch(()=>reject("Problem while invoking API"));
            
            if(response===undefined){
                reject("error on put request");
            }
            else{
                if(response.result=="success")
                    resolve(true);
                else    
                    reject(response.error)
            }   
        }         
    })
}