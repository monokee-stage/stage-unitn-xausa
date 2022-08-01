import * as ed from '@noble/ed25519';
import * as bs58 from 'bs58';
import fetch from 'node-fetch'
import { resolveDID } from './resolveDID';
import { VerificationMethod } from './types';


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

        let signature=await ed.sign(Buffer.from(sup),bs58.decode(privatekey)).catch(()=>reject("an error occured while signing the message body"));

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

/**
 * 
 * @param privatekey to sign the message and authenticate 
 * @param methodUrl informations about the DID to be modified. The key is automatically assigned.
 * @returns a boolean that guarantees the success of the operation
 */
export async function addVerificationMethod(encodedPrivateKey:string,signingPrivateKey:string,did:string):Promise<boolean>{
    return new Promise<boolean>(async(resolve,reject)=>{
        let document=(await resolveDID(did)).didDocument;
        let keyNumber=<number>document.verificationMethod?.length+1;
        let encodedPublicKey=bs58.encode(await ed.getPublicKey(bs58.decode(encodedPrivateKey)));

        let i=0;
        let found=false;
        while(i<keyNumber-1 &&!found ){
            if(document.verificationMethod?.at(i)?.publicKeyBase58==encodedPublicKey)
                found=true;
            i++
        }

        if(found)
            reject("public key is already used by another method");
        else{
            let vm:VerificationMethod={
                id: did+"#key-"+keyNumber,
                type: "Ed25519VerificationKey2018",
                controller: did,
                publicKeyBase58: encodedPublicKey
            };

            let message =JSON.stringify({
                did:did,
                verificationMethod:vm,
            });

            let signature=await ed.sign(Buffer.from(message),bs58.decode(signingPrivateKey)).catch(()=>reject("an error occured while signing the message body"));


            if(signature instanceof Uint8Array){
                let encodedSignature=bs58.encode(<Uint8Array>signature);
                let body={
                    did:did,
                    verificationMethod:vm,
                    signature:encodedSignature
                }
    
                let url="http://localhost:8080/addverificationmethod"
                //perform the put fetch request and check the result
                let response:any = await fetch(url,{
                    method: 'put',
                    body: JSON.stringify(body),
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
        }
    })
}