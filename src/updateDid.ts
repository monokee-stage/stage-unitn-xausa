import * as ed from '@noble/ed25519';
import * as bs58 from 'bs58';
import fetch from 'node-fetch'

/**
 * 
 * @param newKey new base58 public keykey 
 * @param methodUrl method to be updated
 * @returns a boolean that certifies the registration of the update
 */
export async function updateKey(privatekey:string,newKey:string,methodUrl:string):Promise<boolean>{
    return new Promise<boolean>(async(resolve,reject)=>{
        //create the message and the signature
        let sup=JSON.stringify({
            methodUrl:methodUrl,
            newKey:newKey
        })

        let signature=await ed.sign(Buffer.from(sup),bs58.decode(privatekey)).catch(()=>console.log("an error occured while signing the message body"));

        if(signature instanceof Uint8Array){
            let encodedSignature=bs58.encode(<Uint8Array>signature);

            //the final request body with the update info and the base58 signature
            let requestBody={
                methodUrl:methodUrl,
                newKey:newKey,
                signature:encodedSignature
            }
    
            let url = "http://localhost:8080/updatekey";
            
            //perform the put fetch request and check the result
            let response:any = await fetch(url,{
                method: 'put',
                body: JSON.stringify(requestBody),
                headers: {'Content-Type': 'application/json'}
            }).then((res:any)=>{return res.json()}).catch(()=>reject("Problem wile invoking API"));
            
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