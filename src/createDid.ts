const uuid = require('uuid');
import * as ed from '@noble/ed25519';
import * as bs58 from 'bs58';
import * as fetch from 'node-fetch';
require('util').inspect.defaultOptions.depth = null; // just to see the full log object

export interface ServiceEndpoint {
    id: string
    type: string
    serviceEndpoint: string
    description?: string
};

export interface VerificationMethod {
    id: string
    type: string
    controller: string
    publicKeyBase58: string
};

export interface DIDDocument {
    '@context': 'https://www.w3.org/ns/did/v1' | string | string[]
    id: string
    controller?: string | string[]
    verificationMethod?: VerificationMethod[]
    authentication?:string[]
    assertionMethod?:string[]
    keyAgreement?:string[]
    service?: ServiceEndpoint[]
};

//request body to be sent in the fetch request
export interface RequestBody{ 
    didDocument:DIDDocument //did Document
    signature:string        //base 58 signature (signature is produce from a Uint8Array of the document, not a string)
}


/**
 * Creates the DID and the DID Document.
 * @returns a string containind the did
 */
export async function createDID(): Promise<string> {
    try {
        return new Promise<string>(async (resolve,reject)=>{

            //create the did
            let did="did:monokee:"+uuid.v4();

            //create the keys
            let privateKey =  ed.utils.randomPrivateKey();//how to store the private key? should this be performed outside the funcion? (probably)
            let publicKey = await ed.getPublicKey(privateKey);
            let publicKeyb58= bs58.encode(publicKey);
            let x25519key=await ed.getSharedSecret(privateKey,publicKey);
            let x25519keyb58=bs58.encode(x25519key);

            //create the document
            let didDocument=await createDidDocument(did,publicKeyb58,x25519keyb58);

            //obtain 
            let requestbody=await createRequestBody(didDocument,privateKey);
            
            let url:string = "http://localhost:8080/createdid";

            await fetch(url, {
                method: 'post',
                body: JSON.stringify(requestbody),
                headers: {'Content-Type': 'application/json'}
            }).catch(()=>{
                reject("error on post request");
            });
            resolve(did);

        });
        
    } catch (error) {
        console.log(`Error occurred in createDID function ${error}`); //logger could be better
        throw error;
    }
}

/**
 * create the request body for the api POST call
 * @param document 
 * @param privateKey 
 * @returns the body that has to be attached to the api POST request 
 */
async function createRequestBody(didDocument:DIDDocument,privateKey:Uint8Array):Promise<RequestBody>{
    return new Promise<RequestBody>(async(resolve)=>{
        let json =  JSON.stringify(didDocument);
        let message:Uint8Array = Buffer.from(json); 
        //the message is encrypted starting from a Uint8array because of problem
        //while signign the whole document as a string (Number.parseInt() exception)
        let signature= await ed.sign(message,privateKey);
        let encodedSignature= bs58.encode(signature);

        let ret : RequestBody ={
            didDocument:didDocument,
            signature:encodedSignature
        };

        //var string = new TextDecoder().decode(arr); //test the encode
        resolve(ret);
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
