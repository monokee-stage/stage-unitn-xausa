const uuid = require('uuid');
import * as ed from '@noble/ed25519';
import * as bs58 from 'bs58';
import fetch from 'node-fetch';

import { ServiceEndpoint, VerificationMethod, DIDDocument, RequestBody } from './types';


/**
 * Creates the DID and the DID Document.
 * @returns a string containind the did
 */
export async function createDID(privateKey:Uint8Array): Promise<string> {
    return new Promise<string>(async (resolve,reject)=>{
        //create the did
        let did="did:monokee:"+uuid.v4();

        //create the keys
        if(privateKey.length !== 32)
            reject("invalid private key")

        else{
            let publicKey = await ed.getPublicKey(privateKey).catch((err)=>{reject(err)});

            if(publicKey instanceof Uint8Array){ //check on publicKey integrity
                let publicKeyb58= bs58.encode(publicKey);
                let x25519key=await ed.getSharedSecret(privateKey,publicKey).catch((err)=>{reject(err)});
                if(x25519key instanceof Uint8Array){ //check on x25519 key integrity
                    let x25519keyb58=bs58.encode(x25519key);
                    //create the document
                    let didDocument=createDidDocument(did,publicKeyb58,x25519keyb58);
        
                    //obtain 
                    let requestbody=await createRequestBody(didDocument,privateKey).catch((err)=>{reject(err)});
                    if(isRequestBody(requestbody) ){
                        let url:string = "http://localhost:8080/createdid";
                        let responseMetadata:any = await fetch(url, {
                            method: 'post',
                            body: JSON.stringify(requestbody),
                            headers: {'Content-Type': 'application/json'}
                        }).then(async (res)=> {
                            let sup= await res.json();
                            if(res.status!=200)
                                reject(sup.error);
                            else
                                resolve(did);
                        }).catch((err)=>{reject("Error occurred while calling API")});

                    } // close check on requestBody
                }//close check on x25519 shared secret
            }//close check on publicKey validity 
        }
    });
}

/**
 * create the request body for the api POST call
 * @param document 
 * @param privateKey 
 * @returns the body that has to be attached to the api POST request 
 */
async function createRequestBody(didDocument:DIDDocument,privateKey:Uint8Array):Promise<RequestBody>{
    return new Promise<RequestBody>(async(resolve,reject)=>{
        let json =  JSON.stringify(didDocument);
        let message:Uint8Array = Buffer.from(json); 
        //the message is encrypted starting from a Uint8array because of problem
        //while signign the whole document as a string (Number.parseInt() exception)
        let signature= await ed.sign(message,privateKey).catch((err)=>reject(err));
        
        if(signature instanceof Uint8Array){ //if the signature has been successfully created
            let encodedSignature= bs58.encode(signature/*Buffer.from("notAValidKey")*/);
            let ret : RequestBody ={
                didDocument:didDocument,
                signature:encodedSignature
            };
            resolve(ret);
        }
    })
}



/**
 * creates the DID docuemnt data structure
 * @param did 
 * @param pubked 
 * @param pubkx 
 * @returns the data structure with the complete didDocument
 */
 function createDidDocument(did:string,pubked:string,pubkx:string):DIDDocument{

    let vm1:VerificationMethod={
        id: did+"#key-1",
        type: "Ed25519VerificationKey2018",
        controller: did,
        publicKeyBase58: pubked
    };

    let vm2:VerificationMethod={
        id: did+"#key-2",
        type: "X25519KeyAgreementKey2019",
        controller: did,
        publicKeyBase58: pubkx
    };

    let document:DIDDocument={
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did,
        verificationMethod: [vm1,vm2],
        authentication:[vm1.id],
        assertionMethod:[vm1.id],
        keyAgreement:[vm2.id]
    };
    return document;
}

function isRequestBody(s:any):DIDDocument{
    return s.didDocument;
}
